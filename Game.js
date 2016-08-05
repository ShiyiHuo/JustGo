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
    mode: String,
    active: Boolean,
    winner: Number,
    whiteEndTime: Number,
    whiteMsRemaining: Number,
    blackEndTime: Number,
    blackMsRemaining: Number,
    blackUsername: String,
	whiteUsername: String
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

	if (color != this.turn) 
		throw new Rule.GameException("Not your turn.");  
	
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

        move = new Move({
                    x: 0,
                    y: 0,
                    color: color,
                    pass: true,
                    capturedPieces: [],
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
			getArmy(xPos, parseInt(yPos)+1, oppositeColor, this.board, armyToCap, visited);
			if (armyToCap.size > 0 && !armyHasLiberties(this.board, armyToCap)){
				for (let element of armyToCap)
                    capturedPieces.add(element)
			}
			armyToCap = new Set();
			getArmy(xPos, parseInt(yPos)-1, oppositeColor, this.board, armyToCap, visited);
			if(armyToCap.size > 0 && !armyHasLiberties(this.board, armyToCap)){
				for (let element of armyToCap)
                    capturedPieces.add(element)
			}
			armyToCap = new Set();
			getArmy(parseInt(xPos)+1, yPos, oppositeColor, this.board, armyToCap, visited);
			if(armyToCap.size > 0 && !armyHasLiberties(this.board, armyToCap)){
				for (let element of armyToCap)
                    capturedPieces.add(element)
			}
			armyToCap = new Set();
			getArmy(parseInt(xPos)-1, yPos, oppositeColor, this.board, armyToCap, visited);
			if(armyToCap.size > 0 && !armyHasLiberties(this.board, armyToCap)){
				for (let element of armyToCap)
                    capturedPieces.add(element);
			}

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
			}	


		}//end if(board not empty)
		
		const scores = this.getScore();
        move = new Move({
            x: xPos,
            y: yPos,
            color: color,
            pass: false,
            capturedPieces: Array.from(capturedPieces),
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
	this.markModified('board');

	return move;

        // Returns a JSON-string representation of a "point". 
        // Strings are used to create primitive values for points to allow lookup in Sets in constant time. 
        // JSON representation of a point. We use string addition here because 
        // JSON.stringify seems inconsistent with adding quotation marks around the values (e.g. '{"foo":"3"}' vs '{"foo":3}' )
        function point(x, y) {
            return '{"x":' + x + ',"y":' + y + '}';
        }

		
}//end function makeMove


gameSchema.methods.getScore = function(komi) {
	
	const threshold = 2;
	var blackScore = 0;
	var whiteScore = komi ? komi : 0;
	var influence = [];
	for (var i = 0; i < this.board.length; i++) {
		influence[i] = new Array(this.board.length).fill(0);
	}
    
	//this is bad because it defines every piece on board as an influence source
	for (var i = 0; i < this.board.length; i++) {
		for (var j = 0; j < this.board.length; j++) {
			if (this.board[i][j] !== constants.empty) {
				createInfluence(this.board[i][j], i, j, influence);    
			} 
		}
	}
	//----------
	
	//for each in list of influence sources create influence
	//-------

    for (var i = 0; i < influence.length; i++) {
        for (var j = 0; j < influence.length; j++) {
            if (influence[i][j] > threshold) {
                blackScore++;
            } else if (influence[i][j] < -threshold) {
                whiteScore++;
            }
        }
    }
    return { white: whiteScore, black: blackScore , influence : influence};
}

function createInfluence(color, i, j, influenceArr) {
	var multiplier = 0;
	if(color === constants.black) multiplier = 1;
	if(color === constants.white) multiplier = -1;
	
	for (var y = 0; y < influenceArr.length; y++) {
		for (var x = 0; x < influenceArr.length; x++) {
			var dist = Math.sqrt((x-i)*(x-i) + (y-j)*(y-j));
			influenceArr[x][y] += multiplier * influenceFunction(dist, influenceArr.length);
		}
	}
}

/**
*converts a distance to an influence value
*a larger distance translates to a smaller influence value
*/
function influenceFunction(dist, boardSize){
	//to be adjusted experimentally
	return 16 / Math.pow(4,dist);
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
        getArmy(x, parseInt(y)+1, color, board, army, visited);
        // south
		getArmy(x, parseInt(y)-1, color, board, army, visited);
		// east
		getArmy(parseInt(x)+1, y, color, board, army, visited);
		// west
		getArmy(parseInt(x)-1, y, color, board, army, visited);
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
	if (this.blackUsername) {
		User.findOne({username: this.blackUsername}, function (err, user) {
			if (err || !user) 
				return console.log("Error saving stats for username: " + this.username);
			
			if (winner == constants.black) {
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
	}

	if (this.whiteUsername) {
		User.findOne({username: this.whiteUsername}, function (err, user) {
			if (err || !user) 
				return console.log("Error saving stats for username: " + this.username);
			
			if (winner == constants.white) {
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
	}

    return { winner: winner, scores: scores };
}

gameSchema.methods.endGameWithWinner = function(winner) {
    if (!this.active)
        throw new Error("The game has already ended");

    // stop the timers
    this.stopBlackTimer();
    this.stopWhiteTimer();

	if (this.blackUsername) {
		// update user stats
		User.findOne({username: this.blackUsername}, function (err, user) {
			if (err || !user) 
				return console.log("Error saving stats for username: " + this.username);
			
			if (winner == constants.black) 
				user.wins++;
			else 
				user.losses++;
			
			user.save(function (err, user) {
				if (err || !user) {
					console.log("Error saving user stats: " + err);
				}
			});
		});
	}

	if (this.whiteUsername) {
		User.findOne({username: this.whiteUsername}, function (err, user) {
			if (err || !user) 
				return console.log("Error saving stats for username: " + this.username);
			
			if (winner == constants.white)
				user.wins++;
			else 
				user.losses++;

			user.save(function (err, user) {
				if (err || !user) {
					console.log("Error saving user stats: " + err);
				}
			});
		});	
	}

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

gameSchema.methods.resignColor = function(color) {   
    var winner;
    if (this.mode == 'HOTSEAT') {
        winner = (this.turn == constants.black)? constants.white : constants.black
    } else {
        winner = (color == constants.black)? constants.white : constants.black;
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
