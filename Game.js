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

	if (color != this.turn) {
		throw new Rule.GameException("Not your turn.");  
    }
	
	const oppositeColor = (this.turn === constants.black) ? constants.white : constants.black;
	
	var move = undefined;
	
    if (pass) {
        if (this.moveHistory.length > 0) {
            const lastMove = this.moveHistory[this.moveHistory.length - 1];
            if (lastMove.pass) {
                throw new Rule.DoublePassException();
            }
        }

		const scores = this.getScore();
        const deepBoardCopy = JSON.parse(JSON.stringify(this.board));

        move = new Move({
                    x: 0,
                    y: 0,
                    color: color,
                    pass: true,
                    capturedPieces: [],
                    board: deepBoardCopy,
                    whiteScore: scores.white,
                    blackScore: scores.black,
                    whiteTime: this.getPlayerTimes().white,
                    blackTime: this.getPlayerTimes().black});
	}
	else {//no pass
		
		if (this.board[yPos][xPos] != constants.empty) {
			throw new Rule.GameException("Occupied Place.");
		}  
		//this statement executes before adding a piece
		var boardIsEmpty = isEmpty(this.board);
		
		//this places the piece
		this.board[yPos][xPos] = color;
		
		//basically an empty array
		//martin why don't you just use a normal array
		var capturedPieces = new Set();
		
		//below checks for: capturing, ko rule, suicide,
		if (!boardIsEmpty) {
			
			var visited = [];
			for (var i = 0; i < this.board.length; i++) {
				//initialize 2D array corresponding to board
				visited[i] = new Array(this.board.length).fill(false);
			}
			
			//this mess handles capturing by brute force checking the 4 adjacent armies to the played piece
			var armyToCap = new Set();
			getArmy(xPos, yPos+1, oppositeColor, this.board, armyToCap, visited);
			if (armyToCap.size > 0 && !armyHasLiberties(this.board, armyToCap)){
				for (let element of armyToCap)
                    capturedPieces.add(element)
			}
			armyToCap = new Set();
			getArmy(xPos, yPos-1, oppositeColor, this.board, armyToCap, visited);
			if(armyToCap.size > 0 && !armyHasLiberties(this.board, armyToCap)){
				for (let element of armyToCap)
                    capturedPieces.add(element)
			}
			armyToCap = new Set();
			getArmy(xPos+1, yPos, oppositeColor, this.board, armyToCap, visited);
			if(armyToCap.size > 0 && !armyHasLiberties(this.board, armyToCap)){
				for (let element of armyToCap)
                    capturedPieces.add(element)
			}
			armyToCap = new Set();
			getArmy(xPos-1, yPos, oppositeColor, this.board, armyToCap, visited);
			if(armyToCap.size > 0 && !armyHasLiberties(this.board, armyToCap)){
				for (let element of armyToCap)
                    capturedPieces.add(element);
			}
            console.log(JSON.stringify(capturedPieces));

			//the army created by current player move
			var newArmyCreated = new Set();
			getArmy(xPos, yPos, color, this.board, newArmyCreated, visited);
			
			//suicide is checked only if nothing captured
			if(capturedPieces.size === 0){
				if (!armyHasLiberties(this.board, newArmyCreated)) {
					this.board[yPos][xPos] = constants.empty; // undo the board update
					throw new Rule.GameException("You cannot commit suicide.");
				} 
			}
			//koRule is checked only if something captured
			else{
				//ko (repeated board) rule
				//this is done AFTER placing the player's piece and BEFORE removed captured
				//expects this.moveHistory to not be empty
				if (this.koRule(yPos,xPos,capturedPieces)){
					this.board[yPos][xPos] = constants.empty; // undo the board update
					throw new Rule.GameException("You cannot play a move which may lead to an infinite game");
				}
			}

			// remove captured pieces from board
			for (var pieceString of capturedPieces) {
				let piece = JSON.parse(pieceString); // convert to object since army and captured pieces are JSON strings
				this.board[piece.y][piece.x] = constants.empty;
                console.log("board is: " + this.board);
			}	


		}//end if(board not empty)
		
		const scores = this.getScore();
        const deepBoardCopy = JSON.parse(JSON.stringify(this.board));
        move = new Move({
            x: xPos,
            y: yPos,
            color: color,
            pass: false,
            capturedPieces: capturedPieces,
            board: deepBoardCopy,
            whiteScore: scores.white,
            blackScore: scores.black,
            whiteTime: this.getPlayerTimes().white,
            blackTime: this.getPlayerTimes().black
        })
	}//end else (no pass)
		
	// turn done, switch turn state to opposite color
	this.turn = oppositeColor;
	this.moveHistory.push(move);
    
    switchTimers();

	return move;
		
}//end function makeMove


gameSchema.methods.getScore = function() {     

    const createBlackInfluence = (i, j) => {
        for (var y = 0; y < influence.length; y++) {
            for (var x = 0; x < influence.length; x++) {
                influence[y][x] += Math.round(this.board.length - Math.sqrt((x-i)*(x-i) + (y-j)*(y-j)));
            }
        }
    }

    const createWhiteInfluence = (i, j) => {
        for (var y = 0; y < influence.length; y++) {
            for (var x = 0; x < influence.length; x++) {
                influence[y][x] += Math.round(-this.board.length + Math.sqrt((x-i)*(x-i) + (y-j)*(y-j)));
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

/**
*function isEmpty
*input reference to a board object
*returns true if every cell is equal to 0
*/
function isEmpty(board){
	for (var i = 0; i < board.length; i++) {
		for (var j = 0; j < board[i].length; j++) {
				if(board[i][j] !== 0)	return false;
		}
	}return true;
}

//represents a single member of an army, which has coordinates and color
function armyElement(x, y, color) {
	return '{"x":' + x + ',"y":' + y + ',"color":' + color + '}';
}

// recursive depth-first search for armies
// mutates army and visited
function getArmy(x, y, color, board, army, visited) {  //called as getArmy(j,i,...)
	
	//check for out of bounds
	var inBounds = (x >= 0 && x < board.length && y >= 0 && y < board.length);

	//if next index is: not out of bounds; same color; not already in army
	if (inBounds && (board[y][x] === color) && !visited[y][x]) {//[y][x]???
		
		army.add(armyElement(x, y, color));
		visited[y][x] = true;
		
        // north??? y/x confusion
        getArmy(x, y+1, color, board, army, visited);
        // south
		getArmy(x, y-1, color, board, army, visited);
		// east
		getArmy(x+1, y, color, board, army, visited);
		// west
		getArmy(x-1, y, color, board, army, visited);
	}//end if
}//end function
		
//does not mutate board or army
function armyHasLiberties(board, army){
	//var liberties = 0;//unused
	for (var node of army) {
		node = JSON.parse(node); // convert back to object since army is composed of JSON strings 
		var x = node.x;
		var y = node.y;

		//bools
		//JS arrays behave weirdly
		//array.length returns max index + 1, regardless of gaps in the array
		//negative array indexes can be defined and do not affect array.length
		var rightLiberty = (x + 1 < board.length) &&(board[y][x + 1] === constants.empty);
		var leftLiberty  = (x - 1 >= 0) 		&&	(board[y][x - 1] === constants.empty);
		var northLiberty = (y + 1 < board.length) &&(board[y + 1][x] === constants.empty);
		var southLiberty = (y - 1 >= 0) 		&&	(board[y - 1][x] === constants.empty);
	
		if (rightLiberty || leftLiberty || northLiberty || southLiberty) {
			return true;
		}
	}//end for
	return false;		
}//end function

//these 3 functions should be put in a Board class but such a class doesnt exist yet
/**
*function deepCopy
*input reference to a board object
*returns a copy of the board
*should work with any 2D array
*/
function deepCopy(board){
	var boardCopy = new Array(board.length);
	for (var i = 0; i < board.length; i++) {
		boardCopy[i] = new Array(board[i].length);
		for (var j = 0; j < board[i].length; j++) {
				boardCopy[i][j] = board[i][j];
		}
	}
	return boardCopy;
}

function deepEquals(board1, board2){
	if(board1.length !== board2.length) return false;
	if(board1[0].length !== board2[0].length) return false;
	
	for(var i = 0; i< board1.length; i++){
		for(var j = 0; j< board1[0].length; j++){
			if(board1[i][j] !== board2[i][j]) return false;
		}
	}
	return true;
}

//this is done AFTER placing the player's piece and BEFORE removed captured
//should mutate nothing
gameSchema.methods.koRule = function(yPos,xPos,capturedPieces){
	//if move history does not exist
	if(this.moveHistory!==this.moveHistory || this.moveHistory.length === 0){
		throw new Error("Error at koRule: this.moveHistory does not exist. If this error is encountered while running test cases, make sure that hard-coded board arrangements have at least one item in moveHistory (even a pass should work)");
	}
	
	var newBoard = deepCopy(this.board);
		//capture
		for (var pieceString of capturedPieces) {
			let piece = JSON.parse(pieceString); // convert to object since army and captured pieces are JSON strings
			newBoard[piece.y][piece.x] = constants.empty;
		}
	
	var previousBoard = deepCopy(this.board);
		//undo current move
		previousBoard[yPos][xPos] = constants.empty;
		
		//undo 1 move from opposing player
		var prevMove = this.moveHistory[this.moveHistory.length-1];
		if (!prevMove.pass){
			//unmove
			previousBoard[prevMove.y][prevMove.x] = constants.empty;
			//behaviour of this statement relies on prevMove color being only white or black, not empty
			var colorOfPrevCapturedPieces = ((prevMove.color === constants.white) ? constants.black : constants.white);
			//uncapture
			for (var pieceString of prevMove.capturedPieces) {
				let piece = JSON.parse(pieceString); // convert to object since army and captured pieces are JSON strings
				previousBoard[piece.y][piece.x] = colorOfPrevCapturedPieces;
			}
		}
		
	return deepEquals(newBoard,previousBoard);
}


gameSchema.methods.endGame = function() {
    if (!this.active) 
        throw new Error("Game already ended.");

    // stop timers
    this.stopWhiteTimer();
    this.stopBlackTimer();
    
    // decide on winner then mark winner state
    var scores = this.getScore();
    var winner = scores.white > scores.black ? constants.white : constants.black;
    this.winner = winner;
    this.active = false 

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

    return { winner: winner, scores: scores };
}

gameSchema.methods.endGameWithWinner = function(winner) {
    if (!this.active)
        throw new Error("The game has already ended");

    // stop the timers
    this.stopBlackTimer();
    this.stopWhiteTimer();

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
        winner = (this.clientColor == constants.black)? constants.white : constants.black;
    }
    return this.endGameWithWinner(winner);
}

gameSchema.methods.startWhiteTimer = function() { 
    this.whiteEndTime = Date.now() + this.whiteMsRemaining;
    whiteIntervals[this._id.id] = setInterval(() => {
        this.whiteMsRemaining = this.whiteEndTime - Date.now(); 
        if (this.whiteMsRemaining <= 0) {
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
