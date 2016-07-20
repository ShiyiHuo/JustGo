"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const sessions = require('client-sessions');

const constants = require('./game/constants');
const AIInterface = require('./ai/AIInterface');
const MongoInterface = require('./MongoInterface');

const go = require('./game/go');
const app = express();
const Game = require('./Game');
const User = require('./User');
const activeGames = {};

// set up middleware 
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(sessions({
    cookieName: 'session',
    secret: 'sh',
    duration: 5 * 60 * 1000,
    activeDuration: 5 * 60 * 1000
}));
app.use(express.static("public")); 

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
 * User attempts to sign up
 * 
 * @param post data should be in the format {username: string, password: string}
 *  */
app.post('/signUp', function(req,res) {

    if (!req.body.username || !req.body.password) {
        console.log("Invalid username/password combination");
        res.status(400).write("Invalid username/password combination");
        return res.end();
    }

    const user = new User({
        username: req.body.username,
        password: req.body.password,
        wins: 0,
        losses: 0
    });

    user.save(function(err, user) {
        if (err || !user) {
            res.write(JSON.stringify({
                redirect: '',
                status: 'invalidUsername',
                login: 'no'
            }));
            res.end();
        } else {
            req.session.username = user.username;
            res.write(JSON.stringify({
                redirect: '/gamepage.html',
                status: 'OK',
                login: 'yes'
            }));
            res.end();
        }
    });
});

/**
 *  User attempts to login
 * 
 * @param post data should be in format { username: username, password: password }
 * 
 * */
app.post('/login', function(req,res) {

    if (!req.body.username || !req.body.password) {
        console.log("Invalid username/password combination");
        res.status(400).write("Invalid username/password combination");
        return res.end();
    }

    var query = User.findOne({username: req.body.username, password: req.body.password});
    query.exec(function(err, user) {
        if (err || !user) {
            res.write(JSON.stringify({
                redirect: '',
                status: 'invalidLogin',
                login: 'no'
            }));
            return res.end();
        } else {
            req.session.username = user.username; // add login info to session
            res.write(JSON.stringify({
                redirect: '/gamepage.html', 
                status: 'OK',
                login: 'yes'
            }));
            return res.end();
        }
    });

});

/**
 * Find out if client is logged in
 * 
 * @return response containts { login: 'yes' } or { login: 'no' } 
 * */
app.post('/getStatus', function(req, res){
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

app.use('/user', function(req, res, next) {
    if (!req.session || !req.session.username) {
        console.log("User not logged in.");
        res.redirect('/login.html');
        res.end();
    } else {
        next();
    }
});

/**
 * Client logs out
 */
app.post('/user/logout', function(req,res) {
    req.session.reset();
    res.write(JSON.stringify({
        redirect: '/',
        status: 'OK',
        login: 'no'
    }));
    res.end();
});

/**
 * This route means the user selects to play AI
 * If logged in route to game page, otherwise to login
 *  
 * */
app.post('/user/playAIB', function(req, res) {
    res.redirect('/gamepage.html');
    res.end();
});

/**
 * This route means the user selects to play in hotseat mode
 * If logged in route to game page, otherwise to login
 * */
app.post('/user/playHSB', function(req, res) { // TODO: do we even need this path?
    res.redirect('/gamepage.html');
    res.end();
});

app.post('/user/stats', function(req, res) {
    var query = User.findOne({username: req.session.username});
    query.exec(function(err, user) {
        if (err || !user) {
            res.status(400).write("Could not find stats for this username");
            return res.end();
        } else {
            res.json({
                wins: user.wins,
                losses: user.losses
            })
        }
    });
});


/**
 * Create a new game state and store it in database
 *
 * @param req should be in form { size : int, hotseat : boolean }
 */
app.post("/newGame", function(req, res) {
    
    if (!req.session || !req.session.username) {
        console.log("Invalid session cookie: " + JSON.stringify(req.session));
        res.status(400).write("Could not find client session cookie");
        return res.end();     
    }
    
    let size;
    let hotseat;
    try {
        size = JSON.parse(req.body.size); // TODO: check correct types
        hotseat = JSON.parse(req.body.hotseat);
    } catch (err) {
        if (err instanceof SyntaxError) {
            console.log("SyntaxError parsing /newGame post data");
            res.status(400).write("Error parsing post data");
            return res.end();
        } else {
            console.log("Caught error parsing /newGame post data " + err);
        }
    }

    let board = [];
    for (var i = 0; i < size; i++) {
        board[i] = new Array(size).fill(constants.empty);
    }

    const game = new Game({
        board: board,
        turn: constants.black,
        moveHistory: [],
        hotseatMode: hotseat,
        clientColor: constants.black,
        active: true,
        winner: null,
        whiteMsRemaining: constants.startingTimePool,
        blackMsRemaining: constants.startingTimePool,
        username: req.session.username
    });

    game.save(function (err, game) {
        if (err || !game) {
            console.log("Error saving new game: " + err);
            res.status(400).write("Error saving new game")
            return res.end();
        }
        activeGames[game._id.id] = game;
        req.session.gameID = game._id.id;
        res.end();
    });  

});

// middleware for all "/game" routes
app.use('/game', function(req, res, next) {
    // check if session cookie
    if (!req.session || !req.session.gameID || !req.session.username) {
        console.log("Invalid session cookie: " + JSON.stringify(req.session));
        res.status(400).write("Could not find client session");
        return res.end();
    } 
   
     // initialize game for this gameID if not active
    if (activeGames[req.session.gameID]) {
        next();
    } else { 
        Game.findById(req.session.gameID, function(err, game) {
            if (err || !game) {
                res.status(400).write("Could not find game in database");
                next();
            } else {
                activeGames[req.session.gameID] = game;
                next();        
            }
        });
    }
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
app.get("/game/longpoll", function(req, res) {
    longpollRequests.push({
        req: req,
        res: res,
        timestamp: Date.now()
    });
});
setInterval(function() {
    
    for (const longpoll of longpollRequests) {    

        const game = activeGames[longpoll.req.session.gameID];

        if (Date.now() - longpoll.timestamp > 29999) { // server-side timeout
            longpoll.res.end();
            const longpollIndex = longpollRequests.indexOf(longpoll);
            longpollRequests.splice(longpollIndex, 1);

        } else if (game.turn != game.clientColor && !game.hotseatMode) { // AI's Turn
            // query the AI 
            AIInterface.query(game, function(data) {
                    
                // Try to make the AI's move
                let aiMove = JSON.parse(data);
                let boardUpdates;
                try {
                    boardUpdates = game.makeMove(aiMove.y, aiMove.x, aiMove.c, aiMove.pass);
                } catch (err) {
                    if (err instanceof go.DoublePassException) { // two passes occured in a row. The game is over
                        console.log("Two passes occured in a row. Ending game...");
                        game.endGame();
                        return;
                    } else if (err instanceof go.GameException) { // ai made some illegal move
                        console.log("AI made some illegal move");
                        return;
                    }
                } 
                // respond to longpoll with AI's move and remove requests from queue
                longpoll.res.json(boardUpdates); 
                const longpollIndex = longpollRequests.indexOf(longpoll);
                longpollRequests.splice(longpollIndex, 1);

                // save the game into the database
                game.markModified('board');
                game.save(function(err) {
                    if (err) throw err;
                });
            });  

        } else if (!game.active) { // game is over
            const endGame = game.getEndGameState();
            const longpollIndex = longpollRequests.indexOf(longpoll);
            longpoll.res.json({ winner: endGame.winner, whiteScore: endGame.scores.white, blackScore: endGame.scores.black });
            longpollRequests.splice(longpollIndex, 1);

            game.markModified('board');
            game.save(function(err) {
                if (err) {
                    console.log("Error saving game: " + err);
                }
            });
            return;
        }
    }
}, 100);

/**
 * Player resigns
 */
app.post("/game/resign", function(req, res) {
    const game = activeGames[req.session.gameID];
    game.resignClient();
    res.end();
});

/**
 * Get game state of the client
 */
app.get("/game", function(req, res) {
    // remove all longpoll requests with this game ID
    for (const longpoll of longpollRequests) {
        if (longpoll.req.session.gameID == req.session.gameID) {
            // delete this longpoll from the array
            const longpollIndex = longpollRequests.indexOf(longpoll);
            longpollRequests.splice(longpollIndex, 1);             
        }
    }
    // find game and respond with it
    const game = activeGames[req.session.gameID];
    game.username = req.session.username; // TODO: ???
    res.json(game);
});

/**
 * Get move history of the current game
 */
app.get('/game/moveHistory', function(req,res) {
    let game = activeGames[req.session.gameID];
    res.json(game.moveHistory);
});

/**
 * Sent when the client clicks the board.
 * @param req should be in form { x: int, y: int, pass: boolean, resign: boolean }
 *
 * @return response is { board: Array, capturedPieces: Array, whiteScore: Number, blackScore: Number }
 */
app.post("/game/makeClientMove", function(req, res, next) {

    // game should already be active at this point
    const game = activeGames[req.session.gameID];
    if (!game.active) {
        res.status(400).send("Cannot make move on game that is inactive");
        res.end();
        return;
    }

    // try to make the client's move
    var boardUpdates;
    let clientTurn = game.hotseatMode? game.turn : game.clientColor;
    try {
        boardUpdates = game.makeMove(req.body.x, req.body.y, clientTurn, req.body.pass);
    } catch (err) { // Handle game errors by ending response and returning from function 

        if (err instanceof go.DoublePassException) { // two passes occured in a row
            game.endGame(); // end the game so the longpoll request is responded to
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
    game.markModified('board');
    
    game.save(function(err) {
        if (err) {
            throw err;
        }
    }); 

    res.json(boardUpdates);  
});