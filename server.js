var express = require("express");
var bodyParser = require("body-parser");
var EventEmitter = require('events').EventEmitter;
var sessions = require('client-sessions');
var go = require('./game/go');
var constants = require('./game/constants');
var AIInterface = require('./ai/AIInterface');
var MongoInterface = require('./MongoInterface');
var events = require('./events');

var app = express();
var messageBus = new EventEmitter();
messageBus.setMaxListeners(200);

const Timers = {};

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(sessions({
    cookieName: 'session',
    secret: 'sh',
    duration: 5 * 60 * 1000,
    activeDuration: 0
}));

// redirect requests to the login page
app.get('/', function(req,res) {
    res.redirect('/login.html');
});

/**
 * Set up server
 */
app.listen(30144, function() {
    console.log("Express listening on port 30144");
});

//redirect requests to the login page
app.get('/', function(req,res) {
    res.redirect('/login.html');
});

app.get('/gamepage.html', function (req,res,next){
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/login.html');
        res.end();
   }
});

//user selects to play AI
//if logged in route to gamepage else route to login
app.post('/playAIB', function(req, res) {
    if (req.session && req.session.user){
        res.write(JSON.stringify({
            redirect: '/gamepage.html',
            status: 'OK',
            login: 'yes'
        }));
        res.end();
    } else {
        res.write(JSON.stringify({
            redirect: '',
            status: 'noSession',
            login: 'no'
        }));
        res.end();
    }
});

//user attempts to login
app.post('/login', function(req,res) {

    //store user as submitted username and password
    var user = {username: req.body.username, password: req.body.password};

    MongoInterface.loginUser(req.body.username, req.body.password, function(successful) {
        if (successful) {
            req.session.user = user;
            res.write(JSON.stringify({
                redirect: '/gamepage.html',
                status: 'OK',
                login: 'yes'
            }));
        } else {
            res.write(JSON.stringify({
                redirect: '',
                status: 'invalidLogin',
                login: 'no'
            }));
        }
        res.end();
    });

});

//client logs out
app.post('/logout', function(req,res) {
    req.session.reset();
    res.write(JSON.stringify({
        redirect: '/',
        status: 'OK',
        login: 'no'
    }));
    res.end();
});

//client requests current status
app.post('/getStatus', function(req,res){
    if (req.session && req.session.user) {
        res.write(JSON.stringify({
            redirect: '',
            status: 'OK',
            login: 'yes'
        }));
    } else {
        res.write(JSON.stringify({
            redirect: '',
            status: 'OK',
            login: 'no'
        }));
    }
    res.end();
});

//user attempts to sign up
app.post('/signUp', function(req,res) {

    var user = {username: req.body.username, password: req.body.password};

    MongoInterface.signUpUser(req.body.username, req.body.password, function(successful) {
        if (successful) {
            req.session.user = user;
            res.write(JSON.stringify({
                redirect: '/gamepage.html',
                status: 'OK',
                login: 'yes'
            }));
            res.end();
        } else {
            res.write(JSON.stringify({
                redirect: '',
                status: 'invalidUsername',
                login: 'no'
            }));
            res.end();
        }
    });

});


/**
 * Create a new game state and store it in database
 *
 * @param req should be in form { size : int, hotseat : boolean }
 *
 * @return response is a gameID
 */
app.post("/newGame", function(req, res, next) {

    const size = JSON.parse(req.body.size);
    const hotseat = JSON.parse(req.body.hotseat);

    // create new game in database, respond with game id
    MongoInterface.newGame(size, hotseat, function(gameID) {
        req.session.gameID = gameID;
        res.end();
        // TODO: also check if it is hotseat play and not clients turn.
        // In that case emit an 'AI TURN' event here aswell
    });

});

/**
 * Periodic polling request from the client every 30 seconds.
 * The request is responded to with data if an event occurs (e.g. AI Makes Move)
 *
 * @return response (if not empty) is are board updates, scores
 */
app.get("/longpoll", function(req, res, next) {
    console.log("GET: /longpoll");
    const aiTurnEvent = events.aiTurn(req.session.gameID);
    const gameOverEvent = events.gameOver(req.session.gameID);
    messageBus.once(aiTurnEvent, onAiTurnEvent);
    messageBus.once(gameOverEvent, onGameOverEvent);

    // remove the event listener after 30 seconds. NOTE: This period NEEDS to match long-polling timeout period on client
    setTimeout(function() {
        messageBus.removeAllListeners(events.aiTurn(req.sessionID));
        messageBus.removeAllListeners(events.gameOver(req.sessionID));
        res.end();
    }, 30000);

    function onGameOverEvent() {
        MongoInterface.endgameWithID(req.session.gameID, req.session.username, function(winner, scores) {
            var responseData = { winner: winner, whiteScore: scores.white, blackScore: scores.black }
            
            res.json(responseData);
            res.end();
            messageBus.removeAllListeners(aiTurnEvent);
            messageBus.removeAllListeners(gameOverEvent);
        })
    }

    function onAiTurnEvent(game) {
        var board = game.board;
        var size = game.board.length;
        var lastMove = game.moveHistory[game.moveHistory.length - 1];
        var formattedAIInput = { size: size,
                                board: board,
                                last: {x: lastMove.y, y: lastMove.x, pass: lastMove.pass, c : lastMove.color} };

        AIInterface.query(formattedAIInput, onAiResponse);

        function onAiResponse(body) {
            var aiMove = JSON.parse(body);
            
            var boardUpdates;
            
            try {
                boardUpdates = go.makeMove(game, aiMove.y, aiMove.x, aiMove.c, aiMove.pass); // NOTE: the AI API uses "x" for rows (confusingly?)
                debugger;
            } catch (err) {
                if (err instanceof go.GameException) {
                    console.log("AI Made an illegal move: " + JSON.stringify(aiMove));
                    onAiTurnEvent(game);
                    return;
                }
            } 
            
            // TODO: handle errors thown by go.makeMove
            // TODO: check AI legal move and requery if not legal

            // update game in database after AI move
            MongoInterface.makeMoveOnGameWithID(
                req.session.gameID,
                aiMove.y,
                aiMove.x,
                aiMove.c,
                aiMove.pass,
                function() {
                    // end response with board updates
                    debugger;
                    res.json(boardUpdates);
                    res.end();
                    messageBus.removeAllListeners(aiTurnEvent);
                    messageBus.removeAllListeners(gameOverEvent);
                }
            );
        }
    }

});

app.get("/resign", function(req, res) {
    messageBus.emit(events.gameOver(req.session.gameID));
    res.end();
});

/**
 * Get game state of the client
 */
app.get("/game", function(req, res) {
    if (req.session.gameID) {
        MongoInterface.getGameWithID(req.session.gameID, function(game) {
            res.json(game);
            res.end();
            if (game.clientColor != game.turn && !game.hotseatMode) {
                messageBus.emit(events.aiTurn(req.session.gameID));
            }  
        });
        messageBus.removeAllListeners(events.aiTurn(req.session.gameID));
        messageBus.removeAllListeners(events.gameOver(req.session.gameID));

    } else {
        res.end();
    }
});

/**
 * Sent when the client clicks the board.
 * @param req should be in form { x: int, y: int, pass: boolean, resign: boolean }
 *
 * @return response is { board: Array, capturedPieces: Array, whiteScore: Number, blackScore: Number }
 */
app.post("/makeClientMove", function(req, res, next) {
   
    // find game in database and make move then respond with board updates
    MongoInterface.makeMoveOnGameWithID(
        req.session.gameID, 
        req.body.x,
        req.body.y,
        constants.clientColor,
        false,
        function(err, game, boardUpdates) {
            if (err) {
                res.write(err.message);
                res.end();
                return;
            }
            res.json(boardUpdates);
            res.end();
            debugger;
            if (game.clientColor != game.turn && !game.hotseatMode) { // see if we need to query AI
                messageBus.emit(events.aiTurn(req.session.gameID), game); // emit event to respond to longpoll
            }
        }
    );

});

