"use strict";
const mongoose = require('mongoose');
const constants = require('./game/constants');
const go = require('./game/go');

/*
mongoose.connect('mongodb://localhost/GoData');
this.db = mongoose.connection;
this.db.on('error', console.error.bind(console, 'connection error'));
this.db.once('open', function() {
    console.log("succesfully connected to mongo");
});
*/
const gameSchema = new mongoose.Schema({
    board: Array,
    turn: Number,
    moveHistory: Array,
    hotseatMode: Boolean,
    clientColor: Number,
    active: Boolean,
    whiteTimer: { type: mongoose.Schema.Types.ObjectId, ref: 'Timer'},
    blackTimer: { type: mongoose.Schema.Types.ObjectId, ref: 'Timer'},
    winner: Number,
    whiteEndTime: Number,
    whiteMsRemaining: Number,
    whiteTimeoutId: Object,
    blackEndTime: Number,
    blackMsRemaining: Number,
    blackTimeoutId: Object
});

gameSchema.methods.makeMove = function(xPos, yPos, color, pass) {
    const boardUpdates = go.makeMove(this, xPos, yPos, color, pass);

    this.startBlackTimer();
    this.startWhiteTimer();

   // boardUpdates.whiteTime = this.getPlayerTimes().white; 
    //boardUpdates.blackTime = this.getPlayerTimes().black; 

    return boardUpdates;
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

gameSchema.methods.startWhiteTimer = function() {
    this.whiteEndTime = Date.now() + this.whiteMsRemaining;
    
    while (true) {
        if (Date.now() > this.whiteEndTime) {
            this.endGameWithWinner(constants.black);
        }
    }

}

gameSchema.methods.stopWhiteTimer = function() {
    clearInterval(this.whiteTimeoutId);
}

gameSchema.methods.startBlackTimer = function() {
    this.blackEndTime = Date.now() + this.blackMsRemaining;
    clearInterval(this.blackTimeoutId);
    this.blackTimeoutId = setInterval(() => {
        this.blackMsRemaining = this.blackEndTime - Date.now(); 
        if (this.blackMsRemaining <= 0) {
            this.endGameWithWinner(constants.white);
            clearInterval(this.blackTimeoutId);
        }   
    }, 99999999);
}

gameSchema.methods.stopBlackTimer = function() {
    clearInterval(this.blackTimeoutId);
}

gameSchema.methods.getPlayerTimes = function() {
    return { white: this.whiteMsRemaining, black: this.blackMsRemaining }
}

module.exports = mongoose.model('Game', gameSchema);
