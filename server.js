"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const EventEmitter = require('events').EventEmitter;
const sessions = require('client-sessions');

const go = require('./game/go');
const constants = require('./game/constants');
const AIInterface = require('./ai/AIInterface');
const MongoInterface = require('./MongoInterface');
const events = require('./events');
const GameTimer = require('./GameTimer');

const app = express();
const messageBus = new EventEmitter();
messageBus.setMaxListeners(200);
const gameTimers = {};

// set up middleware 
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(sessions({
    cookieName: 'session',
    secret: 'sh',
    duration: 5 * 60 * 1000,
    activeDuration: 5 * 60 * 1000
}));
app.use(express.static("public")); // must be at very bottom since express goes through middleware in order

// redirect requests to the login page
app.get('/', function(req,res) {
    res.redirect('/login.html');
    res.end();
});

/**
 * Set up server on ports assigned in class
 */
app.listen(30144, function() {
    console.log("Express listening on port 30144");
});


/**
 * Redirect requests to the login page
 *  */
app.get('/', function(req,res) {
    res.redirect('/login.html');
    res.end();
});

app.get('/gamepage.html', function (req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/login.html');
        res.end();
   }
});

/**
 * This route means the user selects to play AI
 * If logged in route to game page, otherwise to login
 *  
 * */
app.post('/playAIB', function(req, res) {
    if (req.session && req.session.user){
        res.write(JSON.stringify({
            redirect: '/gamepage.html',
            status: 'OK', // TODO: could be refined?
            login: 'yes' // boolean?
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

/**
 * This route means the user selects to play in hotseat mode
 * If logged in route to game page, otherwise to login
 * */
app.post('/playHSB', function(req, res) { // TODO: do we even need this path?
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

/**
 *  User attempts to login
 * 
 * @param post data should be in format { username: username, password: password }
 * 
 * */
app.post('/login', function(req,res) {

    var user = {username: req.body.username, password: req.body.password};

    MongoInterface.loginUser(req.body.username, req.body.password, function(successful) {
        if (successful) {
            req.session.user = user; // store user as submitted username and password
            res.write(JSON.stringify({
                redirect: '/gamepage.html', // TODO: This vs res.redirect ???
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

/**
 * Client logs out
 */
app.post('/logout', function(req,res) {
    req.session.reset();
    res.write(JSON.stringify({
        redirect: '/',
        status: 'OK',
        login: 'no'
    }));
    res.end();
});

/**
 * Find out if client is logged in
 * 
 * @return response containts { login: 'yes' } or { login: 'no' } 
 * */
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
            login: 'no' // TODO: boolean?
        }));
    }
    res.end();
});

/**
 * User attempts to sign up
 * 
 * @param post data should be in the format {username: string, password: string}
 *  */
app.post('/signUp', function(req,res) {

    const user = {username: req.body.username, password: req.body.password};

    // TODO: not allow garbage username/password in mongo interface 
    // TODO: hash password, API for this already?
    // TODO: input sanitization???
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

app.post('/user', function(req, res) {
    if (req.session && req.session.username) {
        MongoInterface.getUserStatsWithUsername(req.session.user.username, function(err, wins, losses) {
            const userData = {username: req.session.username, wins: wins, losses: losses};
            res.json(userData);
        });
    }
    else 
        res.end();
});

/**
 * Create a new game state and store it in database
 *
 * @param req should be in form { size : int, hotseat : boolean }
 */
app.post("/newGame", function(req, res, next) {

    const size = JSON.parse(req.body.size);
    const hotseat = JSON.parse(req.body.hotseat);

    // create new game in database, add gameID cookie to client, init the game's timers
    MongoInterface.newGame(size, hotseat, function(err, game, gameID) {
        if (err) return res.status(400).send("Server error creating new game");
        
        req.session.gameID = gameID;

        const onBlackTimeout = () => {
            messageBus.emit(events.gameOver(req.session.gameID), constants.black);
        }
        const onWhiteTimeout = () => {
            messageBus.emit(events.gameOver(req.session.gameID), constants.white);
        }

        gameTimers[gameID] = new GameTimer(onBlackTimeout, onWhiteTimeout);
        if (game.turn == constants.black) 
            gameTimers[gameID].startBlackTimer();
        else 
            gameTimers[gameID].startWhiteTimer();
        

        res.end();
        // TODO: also check if it is hotseat play and not clients turn. In that case emit an 'AI TURN' event here aswell
    });
});

/**
 * Periodic polling request from the client every 30 seconds.
 * The request is responded to with data if an event occurs:
 * 
 * @return response after an aiTurnEvent is:
 *       { board: Array, capturedPieces: Array, whiteScore: Number, blackScore: Number, whiteTime: Number, blackTime: Number }
 * @return response after a player runs out of time is:
 *       { winner: (color constant) see constants.js, whiteScore: Number, blackScore: Number }
 */
app.get("/longpoll", function(req, res) {

    console.log("POST: /longpoll");
    res.timeStart = Date.now();

    (function checkForAiTurn() { 

        if (Date.now() - res.timeStart > 30000) { // timeout
            res.end();
            return;
        }

        // lookup the game with id
        MongoInterface.getGameWithID(req.session.gameID, function(err, game) {

            if (!game.active) {
                console.log("INACTIVE");
            } else if (game.turn != game.clientColor && !game.hotseatMode) { // AI's turn  
                
                const lastMove = game.moveHistory[game.moveHistory.length - 1]; // TODO: empty?
                AIInterface.query({
                    board: game.board,
                    size: game.board.length,
                    last: { x: lastMove.y, y: lastMove.x, pass: lastMove.pass, c: lastMove.color }
                }, 
                function(data) {
                        let aiMove = JSON.parse(data);
                        let boardUpdates;
                        
                        try {
                            boardUpdates = go.makeMove(game, aiMove.y, aiMove.x, aiMove.c, aiMove.pass);
                        } catch (err) {
                            if (err instanceof go.DoublePassException) { // two passes occured in a row. The game is over
                                game.active = false;
                                MongoInterface.endgameWithID(req.session.gameID, req.session.user.username, function(err, winner, score) {
                                    res.json({ winner: winner, whiteScore: score.white, blackScore: score.black });
                                });
                            } else if (err instanceof go.GameException) { // ai made some illegal move
                                console.log("AI made some illegal move");
                                setTimeout(checkForAiTurn, 1)
                                return;
                            }
                        } 
                        game.markModified('board'); // need to tell mongoose that the nested array was modified
                        game.save(function(err, game) {
                            if (err) throw err;
                            if (game.active)
                                res.json(boardUpdates); 
                        });
                });   

            } else {
                setTimeout(checkForAiTurn, 1);  // call the function again
            }
        });

    })();

});

/**
 * Player resigns
 */
app.post("/resign", function(req, res) {
    MongoInterface.endgameWithID(req.session.gameID, req.session.user.username, function(err, winner, score) {
        if (err) throw err;
    });
});

/**
 * Get game state of the client
 */
app.get("/game", function(req, res) {
    if (req.session.gameID) {
        MongoInterface.getGameWithID(req.session.gameID, function(err, game) {
            if (err) return res.status(400).send("Server error finding game with id: " + req.session.gameID);
            
            game.username = req.session.user.username;

            res.json(game);
            res.end();
        });
    } else {
        res.end();
    }
});

/**
 * Get move history of the current game
 */
app.get('/moveHistory', function(req,res) {
    if (req.session && req.session.gameID) {
        MongoInterface.getGameWithID(req.session.gameID, function(err, game) {
            if (err) return res.status(400).send("Error finding game with id: " + req.session.id);
            res.json(game.moveHistory);
        });
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
        req.body.pass, 
        function(err, game, boardUpdates, gameID) {
            if (err) {
                res.write(err.message);
                res.end();
                return;
            }    

            const gameTimer = gameTimers[gameID];
            if (game.turn == constants.black) {
                gameTimer.startBlackTimer();
                gameTimer.stopWhiteTimer();
            } else { 
                gameTimer.startWhiteTimer();
                gameTimer.stopBlackTimer();
            }
            boardUpdates.whiteTime = gameTimer.getWhiteTime();
            boardUpdates.blackTime = gameTimer.getBlackTime();

            res.json(boardUpdates);               
        }
    );

});