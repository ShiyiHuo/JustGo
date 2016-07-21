"use strict";
const mongoose = require('mongoose');
const constants = require('./constants');
const User = require('./User');
const Rule = require('./Rule');

// for active timers indexed by gameID
const whiteIntervals = {};
const blackIntervals = {};

class Move {
    constructor(options) {
        if (options.x === undefined 
            || options.y === undefined 
            || !options.color 
            || options.pass === undefined
            || !options.capturedPieces 
            || !options.board 
            || options.whiteScore === undefined 
            || options.blackScore === undefined
            || options.whiteTime === undefined 
            || options.blackTime === undefined) { // check all parameters given.
                 throw new Error("Invalid parameters to Move");
            }

        this.x = options.x;
        this.y = options.y; 
        this.color = options.color;
        this.pass = options.pass;
        this.capturedPieces = options.capturedPieces;
        this.board = options.board;
        this.whiteScore = options.whiteScore;
        this.blackScore = options.blackScore;
        this.whiteTime = options.whiteTime;
        this.blackTime = options.blackTime; 
    }
}

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

    const switchTimers = () => {
        if (this.turn == constants.black) {
            this.stopWhiteTimer();
            this.startBlackTimer();
        } else { // white turn
            this.stopBlackTimer();
            this.startWhiteTimer();
        } 
    }
    const switchTurns = () => {
        // switch turn state to opposite color
        if (this.turn == constants.black) {
            this.turn = constants.white;
        } else {
            this.turn = constants.black;
        }
    }

    // make sure correct turn
    if (color != this.turn) {
        throw new Rule.GameException("Not your turn.");  
    }

    if (pass) {
        // switch turn state to opposite color
        switchTurns();

        // check if 2 passes in a row
        if (this.moveHistory.length > 0) {
            const lastMove = this.moveHistory[this.moveHistory.length - 1];
            if (lastMove.pass) {
                throw new Rule.DoublePassException();
            }
        }
        // create move for return and moveHistory
        const scores = this.getScore();
        const boardCopy = JSON.parse(JSON.stringify(this.board))
        const move = new Move({
            x: 0,
            y: 0,
            color: color,
            pass: true,
            capturedPieces: [],
            board: boardCopy,
            whiteScore: scores.white,
            blackScore: scores.black,
            whiteTime: this.getPlayerTimes().white,
            blackTime: this.getPlayerTimes().black
        });
        this.moveHistory.push(move);
        switchTimers();

        return move;

    } else { // move is not a pass

        // check for occupied place
        if (this.board[yPos][xPos] != constants.empty) {
            throw new Rule.GameException("Occupied Place.");
        }  

        // temporarily update the board 
        this.board[yPos][xPos] = color;  
        
        // init visited boolean array for DFS
        var visited = [];
        for (var i = 0; i < this.board.length; i++) {
            visited[i] = new Array(this.board.length).fill(false);
        }

        // For all tiles with pieces on board, find armies to calculate liberties
        // append to capturedPieces if an army has no liberties
        var capturedPieces = new Set();
        for (var i = 0; i < this.board.length; i++) {
            for (var j = 0; j < this.board.length; j++) {
                    
                if (this.board[i][j] != constants.empty && !visited[i][j]) { // there is a piece on this board "tile"  
                    // perform depth first search to get armies connected to this piece
                    var army = new Set();       
                    var pieceColor = this.board[i][j];

                    // recursive depth-first search for armies
                    const getArmies = (x, y, color) => {              
                        if (x < 0 || x >= this.board.length || y < 0 || y >= this.board.length) { // out of bounds
                            return;
                        }
                        army.add(point(x, y));
                        visited[i][j] = true;
                        
                        if (y+1 < this.board.length && this.board[y+1][x] == color && !army.has(point(x, y+1))) {
                            // north neighbor is piece of same color and we haven't added it to the army yet
                            getArmies(x, y+1, color);
                        }
                        if (y-1 >= 0 && this.board[y-1][x] == color && !army.has(point(x, y-1))) {
                            // south neighbor is piece of same color and we haven't added it to the army yet
                            getArmies(x, y-1, color);
                        } 
                        if (x+1 < this.board.length && this.board[y][x+1] == color && !army.has(point(x+1, y))) {
                            // east neighbor is piece of same color and we haven't added it to army yet
                            getArmies(x+1, y, color);
                        }
                        if (x-1 >= 0 && this.board[y][x-1] == color && !army.has(point(x-1, y))) {
                            // west neighbor is piece of same color and we haven't added it to army yet
                            getArmies(x-1, y, color);
                        }   
                        
                    }
                    getArmies(j, i, pieceColor);

                    // calculate army's liberties                
                    var liberties = 0;
                    for (var node of army) {
                        node = JSON.parse(node); // convert back to object since army is composed of JSON strings 
                        var x = node.x;
                        var y = node.y;

                        var rightLiberty = x + 1 < this.board.length && this.board[y][x + 1] == constants.empty;
                        var leftLiberty = x - 1 >= 0 && this.board[y][x - 1] == constants.empty;
                        var northLiberty = y + 1 < this.board.length && this.board[y + 1][x] == constants.empty;
                        var southLiberty = y - 1 >= 0 && this.board[y - 1][x] == constants.empty;
                        
                        if (rightLiberty || leftLiberty || northLiberty || southLiberty) {
                            liberties++;
                        }
                    } 

                    // army is captured if it has no liberties
                    if (liberties == 0) {
                        army.forEach((element) => {
                            capturedPieces.add(element);
                        });
                    }

                }
            }
        }
        
        // check suicide
        if (capturedPieces.has(point(xPos, yPos))) {
            this.board[yPos][xPos] = constants.empty; // undo the board update
            throw new Rule.GameException("You cannot commit suicide.");
        } 

        switchTurns();

        // remove captured pieces from board
        for (var piece of capturedPieces) {
            piece = JSON.parse(piece); // convert to object since army and captured pieces are JSON strings
            this.board[piece.y][piece.x] = constants.empty;
        }

        const boardCopy = JSON.parse(JSON.stringify(this.board)); // need a deep copy 

        // create move object for return and moveHistory
        const scores = this.getScore();
        const move = new Move({
            x: xPos,
            y: yPos,
            color: color,
            pass: false,
            capturedPieces: capturedPieces,
            board: boardCopy,
            whiteScore: scores.white,
            blackScore: scores.black,
            whiteTime: this.getPlayerTimes().white,
            blackTime: this.getPlayerTimes().black 
        })
        this.moveHistory.push(move);

        switchTimers();
        return move;

        // Returns a JSON-string representation of a "point". 
        // Strings are used to create primitive values for points to allow lookup in Sets in constant time. 
        // JSON representation of a point. We use string addition here because 
        // JSON.stringify seems inconsistent with adding quotation marks around the values (e.g. '{"foo":"3"}' vs '{"foo":3}' )
        function point(x, y) {
            return '{"x":' + x + ',"y":' + y + '}';
        }

    }
}

gameSchema.methods.getScore = function() {     

    const createBlackInfluence = (i, j) => {
        for (var y = 0; y < influence.length; y++) {
            for (var x = 0; x < influence.length; x++) {
                influence[y][x] += Math.round(this.board.length - Math.sqrt((x-i)*(x-i) + (y-i)*(y-i)));
            }
        }
    }

    const createWhiteInfluence = (i, j) => {
        for (var y = 0; y < influence.length; y++) {
            for (var x = 0; x < influence.length; x++) {
                influence[y][x] += Math.round(-this.board.length + Math.sqrt((x-i)*(x-i) + (y-i)*(y-i)));
            }
        }
    }


    var blackScore = 0;
    var whiteScore = 0;
    var influence = [];
    for (var i = 0; i < this.board.length; i++) {
        influence[i] = new Array(this.board.length).fill(0);
    }
    
    for (var i = 0; i < this.board.length; i++) {
        for (var j = 0; j < this.board.length; j++) {
            if (this.board[i][j] == constants.black) {
                createBlackInfluence(i, j);    
            } 
            if (this.board[i][j] == constants.white) {
                createWhiteInfluence(i, j);
            }
        }
    }

    for (var i = 0; i < influence.length; i++) {
        for (var j = 0; j < influence.length; j++) {
            if (influence[i][j] > 0) {
                blackScore++;
            } else if (influence[i][j] < 0) {
                whiteScore++;
            }
        }
    }


    
    return { white: whiteScore, black: blackScore };
}

gameSchema.methods.endGame = function() {
    if (!this.active) 
        throw new Error("Game already ended.");

    // stop timers
    this.stopWhiteTimer();
    this.stopBlackTimer();
    
    this.active = false 
    
    // decide on winner then mark winner state
    var scores = this.getScore();
    var winner = scores.white > scores.black ? constants.white : constants.black;
    this.winner = winner;

    // update user stats
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
    debugger;

    return { winner: winner, scores: scores };
}

gameSchema.methods.endGameWithWinner = function(winner) {
    if (!this.active)
        throw new Error("The game has already ended");

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

    var scores = this.getScore();
    this.winner = winner;
    this.active = false;

    return { winner: winner, scores: scores };
}

gameSchema.methods.getEndGameState = function() {
    if (this.active)
        throw new Error("Cannot get end game state on an active game");
    return { winner: this.winner, scores: this.getScore() };
}

gameSchema.methods.resignClient = function() {   
    var winner;
    if (this.hotseatMode) {
        winner = (this.turn == constants.black)? constants.white : constants.black
    } else {
        winner = this.clientColor == constants.black? constants.white : constants.black;
    }
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
