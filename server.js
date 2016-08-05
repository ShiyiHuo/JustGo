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
const MODE = {
    HOTSEAT: 'HOTSEAT',
    MULTIPLAYER: 'MULTIPLAYER',
    AI: 'AI'
};

// set up middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(sessions({
    cookieName: 'session',
    secret: 'sh', // TODO: could be longer
    duration: 60 * 60 * 1000,
    activeDuration: 60 * 60 * 1000
}));
app.use(express.static(__dirname + "/public"));

// periodically clear inactive games from activeGames memory
setInterval(function() {
    for (const gameID in activeGames) {
        const game = activeGames[gameID];
        if (!game.active)
            delete activeGames[gameID];
    }
}, 60 * 60 * 1000) 


// listen on port assigned by class
app.listen(30144, function() {
    // connect to mongoose
    const mongoose = require('mongoose');
    mongoose.connect('mongodb://localhost/GoData');
    mongoose.connection.on('error', function(e) {
        console.log("Error connecting to mongo. Terminating process.");
        console.log(e);
        process.exit(1);
    });
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
 * @return {String} loginStatus.redirect - '' or '/gamepage.html'
 * @return {String} loginStatus.status - 'invalidUsername' or 'OK'
 * @return {String} loginsStatus.login - 'yes' or 'no'
 **/
app.post('/signUp', function(req,res) {
    // check if post data valid
    if (!req.body.username || !req.body.password) {
        console.log("Invalid username/password combination");
        return res.status(400).send("Invalid username/password combination");
    }
    // create user. 
    const user = new User({
        username: req.body.username,
        password: req.body.password,
        wins: 0,
        losses: 0
    });
    // try and save user, redirect if succesfully
    user.save(function(err, user) {
        if (err || !user) {
            res.write(JSON.stringify({ 
                redirect: '',
                status: 'invalidUsername',
                login: 'no'
            }));
            res.end();
        } else { // username was valid
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
    // check post data
    if (!req.body.username || !req.body.password) {
        console.log("Invalid username/password combination");
        return res.status(400).send("Invalid username/password combination");
    }
    // try and find if username/password matches (seriously could be more secure. Could use hash function for password storage)
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
 * Client logs out by resetting their session cookie
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
app.post('/user/playHSB', function(req, res) { 
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
 * Get active multiplayer games available to join.
 * @module POST:/user/multiplayergames
 * @function
 */
app.get('/user/multiplayergames', function(req, res) {
    const multiplayerGames = [];
    for (const gameID in activeGames) {
        const game = activeGames[gameID];
        const opponentUsername = (game.whiteUsername)? game.whiteUsername : game.blackUsername
        if (game.active && game.mode == MODE.MULTIPLAYER 
            && opponentUsername != req.session.username && (!game.whiteUsername || !game.blackUsername)) // can't join own game and can't join game that already has 2 users
            multiplayerGames.push({
                id: game._id.id,
                size: game.board.length,
                username: opponentUsername
            });
    }
    res.json(multiplayerGames);
});

/**
 * Join an active multiplayer game
 * @module POST:/user/multiplayergames
 * @function
 * @param {Object} postData
 * @param {String} postData.gameID -- gameID of the game to join
 */
app.post('/user/multiplayergames', function(req, res) {
    let gameID = req.body.gameID;
    let game = activeGames[gameID]; // TODO: what if not valid gameID? not in active games?

    if (!game)
        return res.status(400).send("Invalid gameID to join.")
    if (game.blackUsername && game.whiteUsername)
        return res.status(400).send("This game is already full.")
    if (game.blackUsername == req.session.username || game.whiteUsername == req.session.username)
        return res.status(400).send("Cannot join this game.")

    // join as the vacant color
    if (game.blackUsername)
        game.whiteUsername = req.session.username
    else 
        game.blackUsername = req.session.username

    game.save(function (err, game) {
        if (err || !game) 
            return res.status(400).send("Error saving game after joining");
        
        game.startBlackTimer(); // start the game now
        req.session.gameID = game._id.id;
        res.end();
    })
});

/**
 * Create a new game state and add it to the client's session.
 * @module POST:/newgame
 * @function
 * @param {Object} postData
 * @param {Number} postData.size - board size
 * @param {String} postData.mode - 'HOTSEAT', 'AI' or 'MULTIPLAYER'
 * @param {Number} postData.userColor - the user's color (black = 1 or white = 2)
 */
app.post("/newgame", function(req, res) {
    // check post data
    if (!req.session || !req.session.username || !req.body.size || req.body.size < 3
        || req.body.mode === undefined || req.body.userColor === undefined) 
        return res.status(400).send("Invalid request format.");
    
    // parameter checking
    let size;
    let userColor;
    try {
        size = parseInt(req.body.size); 
        userColor = parseInt(req.body.userColor);
    } catch (err) {
        console.log("Caught error parsing /newGame post data " + err);
        if (err instanceof SyntaxError) 
            return res.status(400).send("Invalid request format.");
        else 
            return res.status(400).send("Invalid request format.");
    }
    let mode = req.body.mode;
    let validModes = Object.keys(MODE);

    if (validModes.indexOf(mode) == -1) 
        return res.status(400).send("Invalid request format.")

    
    // assign username to appropriate color
    let blackUsername;
    let whiteUsername;
    if (userColor == constants.black) {
        blackUsername = req.session.username;
        whiteUsername = null;
    } else {
        whiteUsername = req.session.username;
        blackUsername = null;
    }

    // initialize game document
    let board = [];
    for (var i = 0; i < size; i++) 
        board[i] = new Array(size).fill(constants.empty);

    const game = new Game({
        board: board,
        turn: constants.black,
        moveHistory: [],
        mode: mode,
        active: true,
        whiteMsRemaining: constants.startingTimePool,
        blackMsRemaining: constants.startingTimePool,
        blackUsername: blackUsername,
        whiteUsername: whiteUsername
    });
    game.save(function (err, game) {
        if (err || !game) {
            console.log("Error saving new game: " + err);
            return res.status(400).send("Error saving new game");
        }
        activeGames[game._id.id] = game; // store game in activeGames array
        req.session.gameID = game._id.id; // give game to the client session 

        if (game.mode != MODE.MULTIPLAYER)  // need to find opponent if multiplayer before starting
            game.startBlackTimer();

        res.end();         
    });

});

/**
 * This is middleware for all routes starting with /game.
 * If the user attempts to access a /game path and is not logged in or doesn't have a valid
 * session gameID, the request is ended with status 400.
 * @module /game
 * @function
 *  */
app.use('/game', function(req, res, next) {
    // check valid session cookie
    if (!req.session) {
        console.log("Invalid session cookie.");
        return res.status(400).send("Invalid session cookie.");
    } 
    if (!req.session.gameID) {
        console.log("Invalid session gameID.");
        return res.status(400).send("Invalid session gameID.");
    }
    if (!req.session.username) {
        console.log("Invalid session username.");
        return res.status(400).send("Invalid session username.");     
    }

     // initialize game for this gameID if not active
    if (activeGames[req.session.gameID]) {
        next();
    } else { // not in activeGames array so load it from database
        Game.findById(req.session.gameID, function(err, game) {
            if (err || !game) {
                console.log("Could not find game in database.")
                res.status(400).send("Could not find game.");
            } else {
                activeGames[req.session.gameID] = game;
                // restart start the timer
                if (game.turn == constants.black)
                    game.startBlackTimer();
                else 
                    game.startWhiteTimer();
                next();
            }
        });
    }
});

/**
 * Periodic polling request from client every ~30 seconds 
 * that is waiting for a user to join his/her created multiplayer game.
 * Responds when 2 users have joined a game.
 * @module GET:/game/matchstatus
 * @function
 * @return {String} redirect - /gamepage.html when 2 users join game
 */
const matchstatusBuffer = [];
app.get('/game/matchstatus', function(req, res) {
    const game = activeGames[req.session.gameID];
    matchstatusBuffer.push({
        req: req,
        res: res,
        timestamp: Date.now()
    });
});
setInterval(function() {
    for (const matchstatus of matchstatusBuffer) {
        const game = activeGames[matchstatus.req.session.gameID];

         if (Date.now() - matchstatus.timestamp > 29999) { // to much time 
             matchstatus.res.end();
             const index = matchstatusBuffer.indexOf(matchstatus);
             matchstatusBuffer.splice(index, 1);
         } else if (game.blackUsername && game.whiteUsername) { // both players joined
             matchstatus.res.send({ redirect: '/gamepage.html' });
             const index = matchstatusBuffer.indexOf(matchstatus);
             matchstatusBuffer.splice(index, 1);      
         } 
    }
}, 100);

/**
 * Periodic polling request from the client every ~30 seconds for game events.
 * Responds with a Move object when a move has been completed by an AI or Multiplayer opponent
 * Responds with an end game state the game ends or is already over. (E.g. due to double pass, Timer, resignation)
 * 
 * @module GET:/game/longpoll
 * @function
 * @return {Move} move - the completed move of client's opponent
 * @return {Object} endGameState - Consists of object with winner, scores
 */
const gameSubscribers = {}; // A data structure for storing requests indexed by [session GameID][session username]
app.get("/game/longpoll", function(req, res) {

    if (!gameSubscribers[req.session.gameID]) { // no subscription to game under this gameID so make one
        gameSubscribers[req.session.gameID] = new Object();
        gameSubscribers[req.session.gameID][req.session.username] = { // index subscription by gameID and username
            req: req,
            res: res,
            timestampe: Date.now()
        }
    } else {
        gameSubscribers[req.session.gameID][req.session.username] = { // subscription to this gameID and username exists so update it 
            req: req,
            res: res,
            timestampe: Date.now()
        }
    }
});

// query AI when it is the AI's turn and push data to game's subscribers
// respond with endGameState if the game is over
setInterval(function playAI() {
    for (const gameID in gameSubscribers) { // iterate over subscriptions by gameID
        const subscribers = gameSubscribers[gameID];
        const game = activeGames[gameID];

        for (const username in subscribers) { // iterate over subscribers in this gameID
            const subscriber = subscribers[username];
            const clientColor = (game.blackUsername == subscriber.req.session.username)? constants.black: constants.white;          

            if (Date.now() - subscriber.timestamp > 29999) { // request timeout
                subscriber.res.end();
                delete gameSubscribers[gameID];
                
            } else if (game.active && game.mode == MODE.AI && game.turn != clientColor) { // AI's Turn
                    
                // try and make AI's move
                AIInterface.query(game, function(aiMove) {
                    let boardUpdates;
                    try {
                        boardUpdates = game.makeMove(aiMove.x, aiMove.y, aiMove.c, aiMove.pass);
                    } catch (err) {
                        if (err instanceof Rule.DoublePassException) { 
                            const endGameState = game.endGame(); 
                            pushToSubscribers(subscriber.req.session.gameID, endGameState);
                            return;
                        } else if (err instanceof Rule.GameException) { 
                            return console.log("AI made some illegal move");
                        }
                    }
                    pushToSubscribers(gameID, boardUpdates);

                    // save the game into the database async
                    game.save(function(err) { 
                        if (err) throw err;
                    });
                });

            } else if (!game.active) { // game has ended 
                const endGameState = game.getEndGameState();
                pushToSubscribers(gameID, endGameState);
            }
        }
    }
}, 100);

/**
 * Respond to GET:/game/longpoll request with 400 error message
 */
function errorToSubscribers(gameID, message) {
    const subscribers = gameSubscribers[gameID];        
    for (const username in subscribers) {
        const subscriber = subscribers[username];
        subscriber.res.status(400).send(message);
    }    
    delete gameSubscribers[gameID];
}

/**
 * Respond to GET:/game/longpoll requests with data for 
 * a given gameID
 */
function pushToSubscribers(gameID, data) {
    const subscribers = gameSubscribers[gameID];        
    for (const username in subscribers) {
        const subscriber = subscribers[username];
        subscriber.res.json(data);
    }    
    delete gameSubscribers[gameID];
}

/**
 * Respond to GET:/game/longpoll requests with data for 
 * a given gameID and username
 * @module
 * @function
 */
function pushToSubscriber(gameID, username, data) {
    const subscriber = gameSubscribers[gameID][username];
    subscriber.res.json(data);
    delete gameSubscribers[gameID][username];
}

/**
 * Player resigns. 
 * Responds to /game/longpoll with endGameState
 * @module
 * @function
 */
app.post("/game/resign", function(req, res) {
    const game = activeGames[req.session.gameID];

    // try to make the client's move
    let clientColor;
    if (game.mode == MODE.HOTSEAT) 
        clientColor = game.turn
    else if (req.session.username == game.blackUsername) 
        clientColor = constants.black;
    else 
        clientColor = constants.white;
    
    if (game.active) {
        const endGameState = game.resignColor(clientColor);
        pushToSubscribers(req.session.gameID, endGameState);
        res.end();
    } else 
        res.send('Game has already ended.');
});

/**
 * Get game state of the client. Should be used for browser refresh.
 */
app.get("/game", function(req, res) {
    const game = activeGames[req.session.gameID];
    res.json(game);
});

/**
 * Return the game's move history
 * @return {Array} moveHistory - an Array of Move Objects corresponding to this game's history
 */
app.get('/game/moveHistory', function(req,res) {
    let game = activeGames[req.session.gameID];
    res.json(game.moveHistory);
});

/**
 * Make move when the client clicks the board. 
 * Responds with a "Move" object
 * 
 * @param {Object} Postdata 
 * @param {Number} x - the column of the move 
 * @param {Number} y - the row of the move
 * @param {Boolean} pass - if the user passes 
 * @return {Move} move - a Move object
 * @return Error message if the move was illegal.
 */
app.post("/game/makeClientMove", function(req, res, next) {
    // game should already be active at this point due to /game middleware
    const game = activeGames[req.session.gameID];
    if (!game.active) 
        return res.status(400).send("Cannot make move on game that is inactive");

    // find out client's color
    let clientColor;
    if (game.mode == MODE.HOTSEAT) 
        clientColor = game.turn
    else if (req.session.username == game.blackUsername) 
        clientColor = constants.black;
    else if (req.session.username == game.whiteUsername)
        clientColor = constants.white;
    else 
        throw new Error("Could not decide on client color"); // for debug
    
    // try and make clients move
    var boardUpdates;
    try {
        boardUpdates = game.makeMove(req.body.x, req.body.y, clientColor, req.body.pass);
    } catch (err) { 
        if (err instanceof Rule.DoublePassException) { 
            const endGameState = game.endGame(); 
            pushToSubscribers(req.session.gameID, endGameState);
            return res.end();
        } else if (err instanceof Rule.GameException) { 
            return res.json({error: err.message});
        } else { // Uncaught error
            console.log("Error making move on the game: " + err);
            return res.status(400).send("Error making move on the game.");
        }
    }

    // notify opponents if multiplayer mode
    if (game.mode == MODE.MULTIPLAYER) { 
        const opponentUsername = (clientColor == constants.black)? game.whiteUsername: game.blackUsername;
        pushToSubscriber(req.session.gameID, opponentUsername, boardUpdates);
    }

    // respond to request
    res.json(boardUpdates);

    // save game asyncly
    game.save(function(err, game) { 
        if (err || !game) {
            console.log("Error saving game after /makeClientMove " + err);
        }
    });
});

module.exports = app;