"use strict";
const mongoose = require('mongoose');
const constants = require('./game/constants');
const go = require('./game/go');
const whiteIntervals = {};
const blackIntervals = {};

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
    blackEndTime: Number,
    blackMsRemaining: Number
});

gameSchema.methods.makeMove = function(xPos, yPos, color, pass) {
    const boardUpdates = go.makeMove(this, xPos, yPos, color, pass);

    
    if (this.turn == constants.black) {
        this.stopWhiteTimer();
        this.startBlackTimer();
    } else { // white turn
        this.stopBlackTimer();
        this.startWhiteTimer();
    } 
    boardUpdates.whiteTime = this.getPlayerTimes().white; 
    boardUpdates.blackTime = this.getPlayerTimes().black;  

    return boardUpdates;
}

gameSchema.methods.getScore = function() {
    return go.getScore(this);
}

gameSchema.methods.endGame = function() {

    this.stopWhiteTimer();
    this.stopBlackTimer();

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
    whiteIntervals[this._id.id] = setInterval(() => {
        this.whiteMsRemaining = this.whiteEndTime - Date.now(); 
        if (this.whiteMsRemaining <= 0) {
            debugger;
            this.stopWhiteTimer();
            this.stopBlackTimer();
            this.endGameWithWinner(constants.black);
            debugger;
        }   
    }, 100);
}

gameSchema.methods.stopWhiteTimer = function() {
    clearInterval(whiteIntervals[this._id.id]);
}

gameSchema.methods.startBlackTimer = function() {

    this.blackEndTime = Date.now() + this.blackMsRemaining;
    blackIntervals[this._id.id] = setInterval(() => {
        this.blackMsRemaining = this.blackEndTime - Date.now(); 
        if (this.blackMsRemaining <= 0) {
            this.stopBlackTimer();
            this.stopWhiteTimer();
            this.endGameWithWinner(constants.white);
        }   
    }, 100);
}

gameSchema.methods.stopBlackTimer = function() {
    clearInterval(blackIntervals[this._id.id]);
}

gameSchema.methods.getPlayerTimes = function() {
    return { white: this.whiteMsRemaining, black: this.blackMsRemaining }
}

module.exports = mongoose.model('Game', gameSchema);
