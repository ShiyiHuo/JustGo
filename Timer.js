"use strict";
const mongoose = require('mongoose');
const constants = require('./game/constants');
const go = require('./game/go');

// define a game schema and model it
const gameSchema = new mongoose.Schema({
    board: Array,
    turn: Number,
    moveHistory: Array,
    hotseatMode: Boolean,
    clientColor: Number,
    active: Boolean,
    whiteTimeLeft: Number,
    blackTimeLeft: Number,
    winner: Number
});

const timerSchema 

gameSchema.methods.makeMove = function(xPos, yPos, color, pass) {
    return go.makeMove(this, xPos, yPos, color, pass);
}

gameSchema.methods.getScore = function() {
    return go.getScore(this);
}

gameSchema.methods.endGame = function() {
    return go.endGame(this);
}

gameSchema.methods.endGameWithWinner = function(winner) {
    return go.endGameWithWinner(this, winner);
}

gameSchema.methods.getEndGameState = function() {
    if (this.active)
        throw "Game Active";

    return { winner: this.winner, scores: this.getScore() };
}

module.exports = mongoose.model('Game', gameSchema);
