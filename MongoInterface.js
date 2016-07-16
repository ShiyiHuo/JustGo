"use strict"
const mongoose = require('mongoose');
const constants = require('./game/constants');
const go = require('./game/go');

var Game;
var User;

class MongoInterface {

    constructor() {    
        // connect to mongodb
        mongoose.connect('mongodb://localhost/GoData');
        this.db = mongoose.connection;
        this.db.on('error', console.error.bind(console, 'connection error'));
        this.db.once('open', function() {
            console.log("succesfully connected to mongo");
        });
        
        // define a game schema
        var gameSchema = new mongoose.Schema({
            board: Array,
            turn: Number,
            moveHistory: Array,
            hotseatMode: Boolean,
            clientColor: Number,
            active: Boolean,
            whiteEndTime: Date,
            blackEndTime: Date
        });
        
        // model the game schema
        Game = mongoose.model('Game', gameSchema);

        // define user schema
        var userSchema = new mongoose.Schema({
            username: {type: String, index: {unique: true}},
            password: String,
            wins: Number,
            losses: Number
        })

        // model user schema
        User = mongoose.model('User', userSchema);
    }
    
    /**
     * Creates a new game and stores it in the database with size or in hotseat options
     * Callback is called with the new game's ID
     */
    newGame(size, hotseatMode, callback) {
        var board = [];
        for (var i = 0; i < size; i++) {
            board[i] = new Array(size).fill(constants.empty);
        }
        debugger;
        
        var whiteEndTime = new Date();
        whiteEndTime.setMinutes(whiteEndTime.getMinutes() + 15);

        var blackEndTime = new Date();
        blackEndTime.setMinutes(blackEndTime.getMinutes() + 15);

        var game = new Game({
            board: board,
            turn: constants.black,
            moveHistory: [],
            hotseatMode: hotseatMode,
            clientColor: constants.black,
            active: true,
            whiteEndTime: whiteEndTime,
            blackEndTime: blackEndTime
        });

        game.save(function (err, game) {
            if (err) return console.error(err);
            callback(game._id.id);
        });
        
    }

    /**
     * Make a move on a game in the database with a given gameID 
     * Callback is executed and passed the updated game document and board updates
     */
    makeMoveOnGameWithID(id, x, y, turn, pass, callback) {
        Game.findById(id, function(err, game) {
            if (err) return console.error(err);
            if (!game) return console.error("Could not find game with id: " + id);
            
            if (turn == constants.clientColor && !game.hotseatMode) {
                turn = game.clientColor;
            } else if (turn == constants.clientColor && game.hotseatMode) {
                turn = game.turn;
            }

            var boardUpdates;
            try {
                boardUpdates = go.makeMove(game, x, y, turn, pass);
            } catch (err) {
                debugger;
                if (err instanceof go.GameException) {
                    callback(err);
                    return;
                }
            }

            game.markModified('board'); // needed to let mongoose know the nested array was modified
            game.save(function(err, game) {
                if (err) return console.error(err);
                if (!game) return console.error("could not find game with id: " + id);
                callback(null, game, boardUpdates);
            });
        });
    }

    getGameWithID(id, callback) {
        Game.findById(id, function(err, game) {
            if (err) return console.error(err);
            callback(null, game);
        });
    }

    endgameWithID(id, username, callback) {
        Game.findById(id, function(err, game) {
            if (err) return console.error(err);
            
            var endGame = go.endGame(game);
            if (endGame.winner == game.clientColor) {
                //this.updateUserWithWin(true, username);
            } else {
                //this.updateUserWithWin(false, username);
            }
            game.save(function(err, game) {
                if (err) return console.error(err);
                callback(endGame.winner, endGame.scores);
            });
            
        });
    }


    /**
     * 
     */
    updateUserWithWin(win, username) {
        /*
        if (win) {

        } else {

        } */
    }

    /**
     * Signs up user with username and password.
     * Callback is executed with true parameter if no error is thrown 
     * Callback is executed with false parameter if error is thrown (e.g. username already exists)
     */
    signUpUser(username, password, callback) {
        var user = new User({username: username, password: password});
        
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
     * Callback is executed with true parameter if no error is thrown 
     * Callback is executed with false parameter if error is thrown (e.g. invalid username/password)
     */
    loginUser(username, password, callback) {
        var query = User.findOne({username: username, password: password});
        query.exec(function(err, person) {
            if (err) {
                callback(false);
                return console.error(err);
            }
            if (person) {
                callback(true);
            } else {
                callback(false);
            }
        });

    }

}

module.exports = new MongoInterface();

