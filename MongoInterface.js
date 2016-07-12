"use strict"
const mongoose = require('mongoose');
const constants = require('./game/constants');
const go = require('./game/go');

var Game;

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
        });
        
        // model the game schema
        Game = mongoose.model('Game', gameSchema);
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
        
        var game = new Game({
            board: board,
            turn: constants.black,
            moveHistory: [],
            hotseatMode: hotseatMode,
            clientColor: constants.black
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
            
            if (turn == constants.clientColor) {
                turn = game.clientColor;
            }

            var boardUpdates = go.makeMove(game, x, y, turn, pass);
            game.markModified('board'); // needed to let mongoose know the nested array was modified
            game.save(function(err, game) {
                if (err) return console.error(err);
                if (!game) return console.error("could not find game with id: " + id);
                callback(game, boardUpdates);
            });
        });
    }
}

module.exports = new MongoInterface();

