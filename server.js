var express = require("express");
var bodyParser = require("body-parser");
var EventEmitter = require('events').EventEmitter;
var sessions = require('client-sessions');
var go = require('./game/go');
var constants = require('./game/constants');
var AIInterface = require('./ai/AIInterface');
var MongoInterface = require('./MongoInterface');

var app = express();
var messageBus = new EventEmitter();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(sessions({
    cookieName: 'session',
    secret: 'sh',
    duration: 60*1000,
    activeDuration: 0
}));

//redirect requests to the login page
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
    var user = {'username': req.body.username, 'password': req.body.password};

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
    console.log("Received request to logout from " + req.session.user.username);
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
    console.log("Received request to get status");
    if (req.session && req.session.user) {
        res.write(JSON.stringify({
            redirect: '',
            status: 'OK',
            login: 'yes'
        }));
        console.log("User logged in.")
    } else {
        res.write(JSON.stringify({
            redirect: '',
            status: 'OK',
            login: 'no'
        }));
        console.log("User not logged in.")
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

    // TODO: allow for customizable sizes
    // TODO: option to construct game with game.hotseatMode = true  

    var size = 9;

    // TODO: also check if it is hotseat play and not clients turn. 
    // In that case emit an 'AI TURN' event here aswell
    
    // create new game in database, respond with game id
    MongoInterface.newGame(size, false, function(gameID) {
        res.json(gameID); // NOTE: won't need to send game id in the future, will just pair a gameID with the user's session
        res.end();
    });

});

/**
 * Periodic polling request from the client every 30 seconds.
 * The request is responded to with move data when the AI is querried 
 * The AI is querried when events with string "AI TURN <gameID>" are emitted
 * 
 * @param req should be in form { gameID : string } 
 * 
 * @return response (if not empty) is a Move object
 */
app.post("/longpoll", function(req, res, next) {

    // wait for 'AI TURN <gameID>' event to query AI and respond to longpoll request
    var aiTurnEvent = 'AI TURN ' + req.body.gameID; 
    messageBus.once(aiTurnEvent, onAiTurnEvent);

    // remove the event listener after 30 seconds. NOTE: This period NEEDS to match long-polling timeout period on client 
    setTimeout(function() {
        messageBus.removeListener(aiTurnEvent, onAiTurnEvent);
        res.end();
    }, 30000); 

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
            var boardUpdates = go.makeMove(game, aiMove.y, aiMove.x, aiMove.c, aiMove.pass); // NOTE: the AI API uses "x" for rows (confusingly?)

            // TODO: handle errors thown by go.makeMove 
            // TODO: check AI legal move and requry if not legal

            // update game in database after AI move
            MongoInterface.makeMoveOnGameWithID(
                req.body.gameID,
                aiMove.y,
                aiMove.x,
                aiMove.c,
                aiMove.pass,
                function() {
                    // end response with board updates
                    res.json(boardUpdates);
                    res.end();
                }
            );

        }   
    }

});

/**
 * Sent when the client clicks the board.
 * @param req should be in form { x: int, y: int, gameID: int, pass: boolean, resign: boolean }
 * 
 * @return response is a Move object
 */
app.post("/makeClientMove", function(req, res, next) {
    
    // find game in database and make move then respond with Move object
    MongoInterface.makeMoveOnGameWithID(
        req.body.gameID, // NOTE: in the future, gameID will be looked up based on the user's session (will pair user sessions with active games) 
        req.body.x, 
        req.body.y, 
        constants.clientColor, 
        false, 
        function(game, boardUpdates) {
            res.json(boardUpdates);
            res.end();
            
            // see if we need to query AI
            if (game.clientColor != game.turn && !game.hotseatMode) { // not in hotseat mode and it is the AI's turn
                var aiTurnEvent = 'AI TURN ' + req.body.gameID; // format for AI TURN event string is 'AI TURN <gameID'
                messageBus.emit(aiTurnEvent, game); // emmit 'AI TURN <gameID> event to query the AI and respond to long poll request
            }
        }
    );

});