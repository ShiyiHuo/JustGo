"use strict"

const mongoose = require('mongoose');
const constants = require('./game/constants');
const go = require('./game/go');

var Game;

class MongoInterface {

    constructor() {
        
        // init database
        mongoose.connect('mongodb://localhost/GoData');
        this.db = mongoose.connection;
        this.db.on('error', console.error.bind(console, 'connection error'));
        this.db.once('open', function() {
            console.log("succesfully connected to mongo");
        });

        // init schema
        var gameSchema = new mongoose.Schema({
            board: Array,
            turn: Number,
            moveHistory: Array,
            hotseatMode: Boolean,
            clientColor: Number,
            sessionID: String
        });

        gameSchema.statics.makeMoveOnGameWithSessionID = function(sessionID, x, y, turn, pass) {
            this.findOne({sessionID: sessionID}, function(err, game) {
                if (err) throw new Error(err);
                if (!game) throw new Error("Could not find game with sessionID");
                
                go.makeMove(game, x, y, turn, pass);
                game.markModified('board');
                game.save(function(err, game) {
                    if (err) return console.error(err);
                    if (game) console.log("made turn and saved game " + game);
                });
            });
        }
        
        Game = mongoose.model('Game', gameSchema);
    }
    
    newGame(size, hotseatMode, sessionID) {
    
        var board = [];
        for (var i = 0; i < size; i++) {
            board[i] = new Array(size).fill(constants.empty);
        }
        
        var game = new Game({
            board: board,
            turn: constants.black,
            moveHistory: [],
            hotseatMode: hotseatMode,
            clientColor: constants.black,
            sessionID: sessionID
        });

        game.save(function (err, game) {
            if (err) return console.error(err);
            console.log("saved game " +  game);
        });
    }

    makeMoveOnGameWithSessionID(sessionID, x, y, turn, pass, callback) {
        Game.makeMoveOnGameWithSessionID(sessionID, x, y, turn, callback);
    }
}




module.exports = MongoInterface

