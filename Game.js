"use strict";
const mongoose = require('mongoose');
const constants = require('./game/constants');
const go = require('./game/go');
const User = require('./User');

// for active timers
const whiteIntervals = {};
const blackIntervals = {};

const gameSchema = new mongoose.Schema({
    board: Array,
    turn: Number,
    moveHistory: Array,
    hotseatMode: Boolean,
    clientColor: Number,
    active: Boolean,
    winner: Number,
    whiteEndTime: Number,
    whiteMsRemaining: Number,
    blackEndTime: Number,
    blackMsRemaining: Number,
    username: String
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

    const endGame = go.endGame(this);

    User.findOne({username: this.username}, function (err, user) {
        if (err || !user) 
            return console.log("Error saving stats for username: " + this.username);
        
        if (endGame.winner = constants.clientColor) {
            user.wins++;
        } else {
            user.losses++;
        }

        user.save(function (err, user) {
            if (err || !user) {
                console.log("Error saving user stats: " + err);
            }
        });
    });

    return endGame;
}

gameSchema.methods.endGameWithWinner = function(winner) {

    User.findOne({username: this.username}, function (err, user) {
        if (err || !user) 
            return console.log("Error saving stats for username: " + this.username);
        
        if (winner == constants.clientColor) {
            user.wins++;
        } else {
            user.losses++;
        }

        user.save(function (err, user) {
            if (err || !user) {
                console.log("Error saving user stats: " + err);
            }
        });
    });

    return go.endGameWithWinner(this, winner);
}

gameSchema.methods.getEndGameState = function() {
    if (this.active)
        throw new Error()

    return { winner: this.winner, scores: this.getScore() };
}

gameSchema.methods.resignClient = function() {
    const winner = this.clientColor == constants.black? constants.white : constants.black;
    return this.endGameWithWinner(winner);
}

gameSchema.methods.startWhiteTimer = function() {
    
    this.whiteEndTime = Date.now() + this.whiteMsRemaining;
    whiteIntervals[this._id.id] = setInterval(() => {
        this.whiteMsRemaining = this.whiteEndTime - Date.now(); 
        if (this.whiteMsRemaining <= 0) {
            this.stopWhiteTimer();
            this.stopBlackTimer();
            this.endGameWithWinner(constants.black);
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
