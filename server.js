"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const sessions = require('client-sessions');

const constants = require('./constants');
const AIInterface = require('./ai/AIInterface');

const app = express();
const Game = require('./Game');
const Rule = require('./Rule');
const User = require('./User');

const activeGames = {};

// set up middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(sessions({
    cookieName: 'session',
    secret: 'sh',
    duration: 60 * 60 * 1000,
    activeDuration: 60 * 60 * 1000
}));
app.use(express.static("public"));

// listen on port assigned by class
app.listen(30144, function() {
    // connect to mongoose
    const mongoose = require('mongoose');
    mongoose.connect('mongodb://localhost/GoData');
    mongoose.connection.on('error', console.error.bind(console, 'connection error'));
    mongoose.connection.once('open', function() {
        console.log("succesfully connected to mongo");
    });

    // make sure guest account exists by upserting
    User.findOneAndUpdate(
        { username: 'guest', password: 'guest'},
        { username: 'guest', password: 'guest', wins: 0, losses: 0},
        { upsert: 'true'}).exec(function(err, user) {
            if (err)
                console.log("Error initialize the guest account: " + err);
    })

    console.log("Express listening on port 30144");
});

// redirect requests to the login page
app.get('/', function(req,res) {
    res.redirect('/login.html');
    res.end();
});

// only allow game page if logged in
app.get('/gamepage.html', function (req, res, next) {
    if (req.session && req.session.username) {
        next(); // go to game page file
    } else {
        res.redirect('/login.html');
        res.end();
   }
});

/**
 * User attempts to sign up with username/password.
 * If no username/password are provided. Responds with 400 status
 * @module POST:/signUp
 * @function
 * @param {Object} userInfo
 * @param {String} userInfo.username
 * @param {String} userInfo.password
 * @return {Object} loginStatus
 * @return {String} loginStatus.redirect - '' or '/gampage.html'
 * @return {String} loginStatus.status - 'invalidUsername' or 'OK'
 * @return {String} loginsStatus.login - 'yes' or 'no'
 **/
app.post('/signUp', function(req,res) {

    if (!req.body.username || !req.body.password) {
        console.log("Invalid username/password combination");
        return res.status(400).send("Invalid username/password combination");
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
 * User attempts to log in with username/password.
 * If no username/password are provided respond with 400 status.
 * @module POST:/login
 * @function
 * @param {Object} userInfo
 * @param {String} userInfo.username
 * @param {String} userInfo.password
 * @return {String} loginStatus
 * @return {String} loginStatus.redirect - '' or '/gampage.html'
 * @return {String} loginStatus.status - 'invalidLogin' or 'OK'
 * @return {String} loginsStatus.login - 'yes' or 'no'
 *  */
app.post('/login', function(req,res) {

    if (!req.body.username || !req.body.password) {
        console.log("Invalid username/password combination");
        return res.status(400).send("Invalid username/password combination");
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
 * Get login status of user's session cookie
 *
 * @return {Object} loginStatus
 * @return {String} loginStatus.redirect - ''
 * @return {String} loginStatus.status - 'OK'
 * @return {String} loginsStatus.login - 'yes' or 'no'
 *  */
app.post('/getStatus', function(req, res){
    if (req.session && req.session.username) {
        res.write(JSON.stringify({
            username: req.session.username,
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
 * This is middleware for all routes starting with /user.
 * If the user attempts to access a /user path and is not logged in this redirects them to login.
 * @module /user
 * @function
 *  */
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
 * @module POST:/user/logout
 * @function
 * @return {Object} loginStatus
 * @return {String} loginStatus.redirect - '/'
 * @return {String} loginStatus.status - 'OK'
 * @return {String} loginsStatus.login - 'no'
 *  */
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
 * User selects to play AI.
 * If the user is logged in (handled by /user middleware), redirect to /gamepage.html
 * @module POST:/user/playAIB
 * @function
 * */
app.post('/user/playAIB', function(req, res) {
    res.redirect('/gamepage.html');
    res.end();
});

/**
 * User selects to play AI.
 * If the user is logged in (handled by /user middleware), redirect to /gamepage.html
 * @module POST:/user/playHSB
 * @function
 * */
app.post('/user/playHSB', function(req, res) { // TODO: do we even need this path?
    res.redirect('/gamepage.html');
    res.end();
});

/**
 * Get logged in user stats
 * @module POST:/user/stats
 * @function
 * @return {Object} userStats
 * @return {Number} userStats.wins
 * @return {Number} userStats.losses
 **/
app.post('/user/stats', function(req, res) {
    var query = User.findOne({username: req.session.username});
    query.exec(function(err, user) {
        if (err || !user) {
            return res.status(400).send("Could not find stats for this username");
        } else {
            const skill = user.wins / (user.losses + 1);
            res.json({
                wins: user.wins,
                losses: user.losses,
                username: user.username,
                skill: skill
            })
        }
    });
});


/**
 * Create a new game state and store it in database
 * @module POST:/newGame
 * @function
 * @param {Object} gameParam
 * @param {Number} gameParam.size
 * @param {Boolean} gameParam.hotseat
 */
app.post("/newGame", function(req, res) {

    if (!req.session || !req.session.username || !req.body.size || req.body.size < 3 || req.body.hotseat === undefined)
        return res.status(400).send("Invalid request format");

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
        game.startBlackTimer();
        req.session.gameID = game._id.id;
        res.end();
    });

});

/**
 * This is middleware for all routes starting with /game.
 * If the user attempts to access a /game path and is not logged in or doesn't have a session gameID,
 * the request is ended with status 400.
 * @module /game
 * @function
 *  */
app.use('/game', function(req, res, next) {
    // check if session cookie
    if (!req.session || !req.session.gameID || !req.session.username) {
        console.log("Invalid session cookie");
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
                res.end();
            } else {
                activeGames[req.session.gameID] = game;
                next();
            }
        });
    }
});



/**
 * Periodic polling request from the client every ~30 seconds.
 * Responds with a status of 400 if the /game/longpoll is requested on an inactive game.
 * Responds with "aiMove" object after the AI makes a move.
 * Responds with "endGame" object when the game ends.
 * @module GET:/game/longpoll
 * @function
 *
 * @return {Object} aiMove
 * @return {Array} aiMove.board
 * @return {Number} aiMove.x
 * @return {Number} aiMove.y
 * @reurn {Boolean} aiMove.pass
 * @return {Array} aiMove.capturedPieces
 * @return {Number} aiMove.whiteScore
 * @return {Number} aiMove.blackScore
 * @return {Number} aiMove.whiteTime
 * @return {Number} aiMove.blackTime
 *
 * @return {Object} endGame
 * @return {Number} endGame.winner
 * @return {Number} endGame.whiteScore
 * @return {Number} endGame.blackScore
 */
const longpollRequests = [];
app.get("/game/longpoll", function(req, res) {
    console.log("GET: /game/longpoll");
    const game = activeGames[req.session.gameID];
    if (game.active)
        longpollRequests.push({ req: req, res: res, timestamp: Date.now() });
    else setTimeout(function() {
        res.status(400).write("The game is over");
        res.end();
    }, 30000)
});
setInterval(function() {
    for (const longpoll of longpollRequests) {

        const game = activeGames[longpoll.req.session.gameID];
        if (Date.now() - longpoll.timestamp > 29999) { // server-side timeout
            longpoll.res.end();
            const longpollIndex = longpollRequests.indexOf(longpoll);
            longpollRequests.splice(longpollIndex, 1);

        } else if (game.turn != game.clientColor && !game.hotseatMode && game.active) { // AI's Turn
            // query the AI
            AIInterface.query(game, function(aiMove) {
                // Try to make the AI's move
                let boardUpdates;
                try {
                    boardUpdates = game.makeMove(aiMove.x, aiMove.y, aiMove.c, aiMove.pass);
                } catch (err) {
                    if (err instanceof Rule.DoublePassException) { // two passes occured in a row. The game is over
                        console.log("Two passes occured in a row. Ending game...");
                        game.endGame();
                        return;
                    } else if (err instanceof Rule.GameException) { // ai made some illegal move
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

            game.markModified('moveHistory');
            game.markModified('moveHistory.board');
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
 * Player resigns.
 * Makes game inactive so the /game/longpoll is responded to
 * @module POST:/game/resign
 * @function
 */
app.post("/game/resign", function(req, res) {
    const game = activeGames[req.session.gameID];
    game.resignClient();
    res.end();
});

/**
 * Get game state of the client. Should be used for browser refresh
 * @module GET:/game
 * @function
 * @return {Game} game - a "Game" object
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
 * If the user has a valid session (handled by /game middleware) ,
 * return the game's move history
 * @module GET:/game/moveHistory
 * @function
 * @return {Array} moveHistory
 */
app.get('/game/moveHistory', function(req,res) {
    let game = activeGames[req.session.gameID];
    res.json(game.moveHistory);
});

/**
 * Make move when the client clicks the board.
 * @module POST:/game/makeClientMove
 * @function
 * @param {Object} move
 * @param {Number} move.x - the row of the board
 * @param {Number} move.y - the column of the board
 * @param {Boolean} move.pass - if the player passes
 * @return {Object} boardUpdates
 * @return {Array} boardUpdates.board
 * @return {Array} boardUpdates.capturedPieces
 * @return {Number} boardUpdates.whiteScore
 * @return {Number} boardUpdates.blackScore
 * @return {Number} boardUpdates.whiteTime
 * @return {number} boardUpdates.blackTime
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
        if (err instanceof Rule.DoublePassException) { // two passes occured in a row
            game.endGame(); // end the game so the longpoll request is responded to
            res.end();
            return;
        } else if (err instanceof Rule.GameException) { // client made some illegal move
            res.write(err.message);
            res.end();
            return;
        } else { // Uncaught error
            console.log("Server error making move on the game: " + err);
            return res.status(400).send("Server error making move on the game");
        }
    }
    game.save(function(err) {
        if (err) {
            throw err;
        }
    });
    res.json(boardUpdates);
});

module.exports = app;
