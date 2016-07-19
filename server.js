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
const games = {};

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

// listen on port assigned by class
app.listen(30144, function() {
    console.log("Express listening on port 30144");
});

// redirect requests to the login page
app.get('/', function(req,res) {
    res.redirect('/login.html');
    res.end();
});

// allow game page if logged in
app.get('/gamepage.html', function (req, res, next) {
    if (req.session && req.session.username) {
        next(); // go to game page file
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
    if (req.session && req.session.username){
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
    if (req.session && req.session.username){
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
    if (!user.username || !user.password) {
        console.log("Invalid username/password combination");
        res.status(400).write("Invalid username/password combination");
        return;
    }

    MongoInterface.loginUser(req.body.username, req.body.password, function(err, user) {
        if (err) {
            res.write(JSON.stringify({
                redirect: '',
                status: 'invalidLogin',
                login: 'no'
            }));
            res.end();
            return;
        } else {
            req.session.username = user.username; // add login info to session
            res.write(JSON.stringify({
                redirect: '/gamepage.html', 
                status: 'OK',
                login: 'yes'
            }));
            res.end();
            return;
        }
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
    if (req.session && req.session.username) {
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
    if (!user.username || !user.password) {
        console.log("Invalid username/password combination");
        res.status(400).write("Invalid username/password combination");
        return;
    }

    MongoInterface.signUpUser(req.body.username, req.body.password, function(successful) { 
        if (successful) { 
            req.session.username = user.username;
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
        MongoInterface.getUserStatsWithUsername(req.session.username, function(err, wins, losses) {
            const userData = {username: req.session.username, wins: wins, losses: losses};
            res.json(userData);
        });
    }
    else 
        res.end();
});

function initGameTimersWithId(gameID) {
    if (!gameID) 
        throw new Error("Tried to initialize timer with gameID: " + gameID);
    if (gameTimers[gameID])
        throw new Error("The timer is already initialized for gameID: " + gameID);

    const onBlackTimeout = function() {

        const game = games[gameID];
        if (!game) {
            MongoInterface.getGameWithID(gameID, function(err, game) {
                go.endGame(game);
                games[gameID] = game; 
            });
        } else {
            go.endGame(game);
        }

    }
    const onWhiteTimeout = () => {

        const game = games[gameID];
        if (!game) {
            MongoInterface.getGameWithID(gameID, function(err, game) {
                go.endGame(game);
                games[gameID] = game; 
            });
        } else {
            go.endGame(game);
        }
    }

    // initialize game timers and start the black one
    gameTimers[gameID] = new GameTimer(onBlackTimeout, onWhiteTimeout);
    gameTimers[gameID].startBlackTimer();
}

/**
 * Create a new game state and store it in database
 *
 * @param req should be in form { size : int, hotseat : boolean }
 */
app.post("/newGame", function(req, res) {

    const size = JSON.parse(req.body.size);
    const hotseat = JSON.parse(req.body.hotseat);

    // create new game in database, add gameID cookie to client, init the game's timers
    MongoInterface.newGame(size, hotseat, function(err, game, gameID) {
        if (err) {
            res.status(400).send("Server error creating new game");
            res.end();
            return; 
        }
        
        req.session.gameID = gameID;

        initGameTimersWithId(gameID);
        
        // store this game into the games array
        games[req.session.gameID] = game;

        res.end();
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
const longpollRequests = [];
app.get("/longpoll", function(req, res) {

    if (!req.session || !req.session.gameID) {
        console.log("Could not find client session");
        res.status(400).write("Could not find client session");
        res.end();
        return;
    }

    longpollRequests.push({
        req: req,
        res: res,
        timestamp: Date.now()
    });

});
setInterval(function() {
    for (const longpoll of longpollRequests) {
        
        const game = games[longpoll.req.session.gameID];

        // check if game is in active games array
        if (!game) { 
            // find the game and put it into the games array
            MongoInterface.getGameWithID(longpoll.req.session.gameID, function(err, game) {
                game[longpoll.req.session.gameID] = game;
            });
            continue;
        }

        // check if timer is initialized
        if (!gameTimers[longpoll.req.session.gameID]) {
            initGameTimersWithId(longpoll.req.session.gameID);
        }

        if (Date.now() - longpoll.timestamp > 29999) { // server-side timeout
            longpoll.res.end();

            // delete this element from the array
            const longpollIndex = longpollRequests.indexOf(longpoll);
            longpollRequests.splice(longpollIndex, 1);

        } else if (game.turn != game.clientColor && !game.hotseatMode) { // AI's Turn
                
                // query the AI 
                AIInterface.query(game, function(data) {
                    let aiMove = JSON.parse(data);
                    let boardUpdates;
                    
                    // Try to make the AI's move
                    try {
                        boardUpdates = go.makeMove(game, aiMove.y, aiMove.x, aiMove.c, aiMove.pass);
                    } catch (err) {
                        if (err instanceof go.DoublePassException) { // two passes occured in a row. The game is over
                            console.log("Two passes occured in a row. Ending game...");
                            const endGame = go.endGame(game);
                            debugger;
                            return;
                        } else if (err instanceof go.GameException) { // ai made some illegal move
                            console.log("AI made some illegal move");
                            return;
                        }
                    } 

                    // update the timers
                    const gameTimer = gameTimers[longpoll.req.session.gameID];
                    if (game.turn == constants.black) {
                        gameTimer.startBlackTimer();
                        gameTimer.stopWhiteTimer();
                    } else { 
                        gameTimer.startWhiteTimer();
                        gameTimer.stopBlackTimer();
                    }
                    boardUpdates.whiteTime = gameTimer.getWhiteTime();
                    boardUpdates.blackTime = gameTimer.getBlackTime();

                    // respond to longpoll with AI's move and remove requests from queue
                    longpoll.res.json(boardUpdates); 
                    const longpollIndex = longpollRequests.indexOf(longpoll);
                    longpollRequests.splice(longpollIndex, 1);

                    // save the game into the database
                    game.save(function(err) {
                        if (err) throw err;
                    });
                });  

        } else if (!game.active) { // game is over
            const endGame = go.endGame(game);
            longpoll.res.json({ winner: endGame.winner, whiteScore: endGame.scores.white, blackScore: endGame.scores.black });
            const longpollIndex = longpollRequests.indexOf(longpoll);
            longpollRequests.splice(longpollIndex, 1);

            game.save(function(err) {
                if (err) throw err;
            })
            return;
        }
    }
}, 100);

/**
 * Player resigns
 */
app.post("/resign", function(req, res) {
    
    if (!req.session || !req.session.gameID) {
        console.log("Could not find client session");
        res.status(400).send("Could not find client session");
        res.end();
        return;
    }

    const game = games[req.session.gameID];

    // game should be in the active games array at this point but check anyways
    if (!game) {
        console.log("Server error finding game");
        res.status(400).write("Server error finding game");
        res.end();
        return;     
    }
    go.endGame(game); // end the game so that it can be responded to by longpoll

});

/**
 * Get game state of the client
 */
app.get("/game", function(req, res) {
    
    if (!req.session || !req.session.gameID) {
        console.log("Could not find client session");
        res.status(400).send("Could not find client session");
        res.end();
        return;
    }
                
    // remove all longpoll requests with this game ID
    for (const longpoll of longpollRequests) {
        if (longpoll.req.session.gameID == req.session.gameID) {
            // delete this longpoll from the array
            const longpollIndex = longpollRequests.indexOf(longpoll);
            longpollRequests.splice(longpollIndex, 1);             
        }
    }

    // find game and respond with it
    const game = games[req.session.gameID];
    if (!game) { // not in the games array
        MongoInterface.getGameWithID(req.session.gameID, function(err, game) {
            game.username = req.session.username // TODO: ???
            games[req.session.gameID] = game; // reassign the games array
            res.json(game);
        })
    } else { // in games array
        res.json(game);
        game.username = req.session.username; // TODO: ??? 
    }

});

/**
 * Get move history of the current game
 */
app.get('/moveHistory', function(req,res) {
    
    if (!req.session || !req.session.gameID) {
        console.log("Could not find cilent session");
        res.status(400).send("Could not find client session");
        res.end()
        return;
    }
    
    let game = games[req.session.gameID];
    if (!game) {
        MongoInterface.getGameWithID(req.session.gameID, function(err, game) {
            if (err) return console.error("Could not find game with id: " + req.session.gameID);
            res.json(game.moveHistory);
        })
        return;
    } else {
        res.json(game.moveHistory);
    }

});

/**
 * Sent when the client clicks the board.
 * @param req should be in form { x: int, y: int, pass: boolean, resign: boolean }
 *
 * @return response is { board: Array, capturedPieces: Array, whiteScore: Number, blackScore: Number }
 */
app.post("/makeClientMove", function(req, res, next) {

    // check if client has session
    if (!req.session || !req.session.gameID) { // okay due to short circuit evaluation
        console.log("Could not find client session");
        res.status(400).send("Could not find client session");
        res.end();
        return;
    }

    // game should already be active at this point
    const game = games[req.session.gameID];
    if (!game) {
        console.log("Server error finding game");
        res.status(400).write("Server error finding game");
        res.end();
        return;
    }

    // try to make the client's move
    var boardUpdates;
    let clientTurn = game.hotseatMode? game.turn : game.clientColor;
    try {
        boardUpdates = go.makeMove(game, req.body.x, req.body.y, clientTurn, req.body.pass);
    } catch (err) { // Handle game errors by ending response and returning from function 

        if (err instanceof go.DoublePassException) { // two passes occured in a row
            go.endGame(game); // end the game so the longpoll request is responded to
            res.end();
            return;
        } else if (err instanceof go.GameException) { // client made some illegal move
            res.write(err.message);
            res.end();
            return;
        } else { // Uncaught error
            console.log("Server error making move on the game: " + err);
            res.status(400).send("Server error making move on the game");
            res.end();
            return;
        }  
    }

    // move was legal, save game to database
    game.save(function(err) {
        if (err) 
            console.log("Database error saving game with id: " + req.session.gameID);
    });

    // game should already have actived timers at this point 
    var gameTimer = gameTimers[req.session.gameID];
    if (!gameTimer) {
        console.log("Server error updating timers");
        res.status(400).send("Server error updating timers");
        res.end();
        return;
    }

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
});

