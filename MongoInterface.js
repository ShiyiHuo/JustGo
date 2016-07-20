"use strict";
const mongoose = require('mongoose');
const constants = require('./game/constants');
const go = require('./game/go');
const Game = require('./Game');
const User = require('./User');

class MongoInterfaceException extends Error {
    constructor(message) {
        super(message);
    }
}
 
class MongoInterface {
    constructor() {    
        // connect to mongodb
        mongoose.connect('mongodb://localhost/GoData');
        this.db = mongoose.connection;
        this.db.on('error', console.error.bind(console, 'connection error'));
        this.db.once('open', function() {
            console.log("succesfully connected to mongo");
        });
    }
    
    /**
     * Creates a new game and stores it in the database with size or in hotseat options
     * Callback is called with parameters (err, game, gameID)
     */
    newGame(size, hotseatMode, callback) {
        let board = [];
        for (var i = 0; i < size; i++) {
            board[i] = new Array(size).fill(constants.empty);
        }

        const garbageTimeout = setTimeout(function() { }, 1);

        const game = new Game({
            board: board,
            turn: constants.black,
            moveHistory: [],
            hotseatMode: hotseatMode,
            clientColor: constants.black,
            active: true,
            winner: null,
            whiteTimeoutId: garbageTimeout,
            blackTimeoutId: garbageTimeout,
            whiteMsRemaining: constants.startingTimePool,
            blackMsRemaining: constants.startingTimePool
        });

        game.save(function (err, game) {
            if (err) callback(err);
            if (!game) callback(new MongoInterfaceException("Error creating new game."));
            callback(err, game, game._id.id);
        });       
    }

    getGameWithId(id, callback) {
        Game.findById(id, function(err, game) {
            if (err) callback(err);
            if (!game) callback(new MongoInterfaceException("Could not find game with id: " + id));
            callback(null, game);
        })
    }

    /**
     * Get the wins and losses of the player with given username
     * @param {String} username 
     * @param {Function} callback to be executed with (err, wins, losses) parameters
     */
    getUserStatsWithUsername(username, callback) {
        if (typeof username !== 'string' || !(callback instanceof Function)) 
            throw new MongoInterfaceException();

        const query = User.findOne({username: username});
        query.exec(function(err, user) {
            if (err) {
                callback(err);
                return console.error(err);
            }
            callback(false, user.wins, user.losses);
        });
    } 

    /**
     * 
     */
    updateUserWithWin(win, username) {
        User.findOne({username: username}, function (err, user) {
            if (err) throw new MongoInterfaceException("Error finding user to update stats");
            if (!user) throw new MongoInterfaceException("Error finding user with username: " + username);

            if (win) {
                user.wins++;
            } else {
                user.losses++;
            }

            user.save(function (err) {
                if (err) {
                    throw new MongoInterfaceException("Error saving user stats. " + err);
                }
            });
        });
    }

    /**
     * Signs up user with username and password.
     * @param {String} username 
     * @param {password} username
     * @param {Function} callback executed with (err) parameter
     */
    signUpUser(username, password, callback) {
        var user = new User({
            username: username, 
            password: password, 
            wins: 0,
            losses: 0
        });
        
        user.save(function(err, user) {
            if (err) { // if duplicates
                callback(false);
                return console.error(err);
            }
            callback(true);
        });
    }

    /**
     * Logs in user with username and password
     * @param {String} username 
     * @param {String} password 
     * @param {Function} callback function to be executed with (err, user) parameter
     */
    loginUser(username, password, callback) {
        var query = User.findOne({username: username, password: password});
        query.exec(function(err, user) {
            if (err) {
                callback(err);
                return console.error(err);
            }
            if (!user) {
                callback(new MongoInterfaceException("Error logging in"));
                return;
            }
            callback(err, user);
        });

    }

}

module.exports = new MongoInterface();