"use strict";
const constants = require('./constants.js');

/**
 * Returned to client after a valid move. 
 * Contains information needed for view to update.
 */
class Move {
    constructor(x, y, color, capturedPieces, board, whiteScore, blackScore, pass) {
        this.x = x;
        this.y = y; 
        this.color = color;
        this.pass = false;
        this.capturedPieces = capturedPieces;
        this.board = board;
        this.whiteScore = whiteScore;
        this.blackScore = blackScore;
        this.pass = pass;
    }
}

/**
 * Provides a base exception class for Game 
 */
class GameException extends Error {
    constructor(message) {
        super(message);
        console.error("GameException: " + message);
    }
}

class DoublePassException extends GameException {
    constructor() {
        super("Two passes occured in a row. The game is over.");
    }
}

/**
 * Make move on a game
 * 
 * @param game is a "Game" object
 * @param xPos is the row of the move
 * @param yPos is the column of the move
 * @param color is either black or white 
 * @param pass is bool
 * 
 * @return is a Move object
 */
function makeMove(game, xPos, yPos, color, pass) {
    
	if (color != game.turn) {
		throw new GameException("Not your turn. " + " color = " + color + " game.turn = " + game.turn);  
    }
	
	const oppositeColor = (game.turn === constants.black) ? constants.white : constants.black;
	
	
	var move = undefined;
	
    if (pass) {
        if (game.moveHistory.length > 0) {
            const lastMove = game.moveHistory[game.moveHistory.length - 1];
            if (lastMove.pass) {
                throw new DoublePassException();
            }
        }

		const scores = getScore(game);
		//    Move(x, y, color, capturedPieces, board, whiteScore, blackScore, pass)
        move = new Move(NaN, NaN, color, [], game.board, scores.whiteScore, scores.blackScore, true);

	}
	else{//no pass
		
		if (game.board[yPos][xPos] != constants.empty) {
			throw new GameException("Occupied Place.");
		}  
		//this statement executes before adding a piece
		var boardIsEmpty = isEmpty(game.board);
		
		//this places the piece
		game.board[yPos][xPos] = color;
		
		//basically an empty array
		//martin why don't you just use a normal array
		var capturedPieces = new Set();
		
		//below checks for: capturing, ko rule, suicide,
		if (!boardIsEmpty) {
			
			var visited = [];
			for (var i = 0; i < game.board.length; i++) {
				//initialize 2D array corresponding to board
				visited[i] = new Array(game.board.length).fill(false);
			}
			
			//this mess handles capturing by brute force checking the 4 adjacent armies to the played piece
			var armyToCap = new Set();
			getArmy(x, y+1, oppositeColor, game.board, armyToCap, visited);
			if(armyToCap.length > 0 && !armyHasLiberties(game.board, armyToCap)){
				army.forEach((element) => {
					capturedPieces.add(element);
				});
			}
			armyToCap = new Set();
			getArmy(x, y-1, oppositeColor, game.board, armyToCap, visited);
			if(armyToCap.length > 0 && !armyHasLiberties(game.board, armyToCap)){
				army.forEach((element) => {
					capturedPieces.add(element);
				});
			}
			armyToCap = new Set();
			getArmy(x+1, y, oppositeColor, game.board, armyToCap, visited);
			if(armyToCap.length > 0 && !armyHasLiberties(game.board, armyToCap)){
				army.forEach((element) => {
					capturedPieces.add(element);
				});
			}
			armyToCap = new Set();
			getArmy(x-1, y, oppositeColor, game.board, armyToCap, visited);
			if(armyToCap.length > 0 && !armyHasLiberties(game.board, armyToCap)){
				army.forEach((element) => {
					capturedPieces.add(element);
				});
			}
			//the army created by current player move
			var newArmyCreated = new Set();
			getArmy(x, y, color, game.board, newArmyCreated, visited);
			//suicide is checked only if nothing captured
			if(capturedPieces.length === 0){
				if (!armyHasLiberties(game.board, newArmyCreated)) {
					game.board[yPos][xPos] = constants.empty; // undo the board update
					throw new GameException("You cannot commit suicide.");
				} 
			}
			//koRule is checked only if something captured
			else{
				//ko (repeated board) rule
				//this is done AFTER placing the player's piece and BEFORE removed captured
				//expects game.moveHistory to not be empty
				if(koRule(game,yPos,xPos,capturedPieces)){
					game.board[yPos][xPos] = constants.empty; // undo the board update
					throw new GameException("You cannot play a move which may lead to an infinite game");
				}
			}

			// remove captured pieces from board
			for (var pieceString of capturedPieces) {
				let piece = JSON.parse(pieceString); // convert to object since army and captured pieces are JSON strings
				game.board[piece.y][piece.x] = constants.empty;
			}	

/*
			var listOfAllArmies = [];
			//visited was defined above, but resetting it to empty here
			visited = [];
			for (var i = 0; i < game.board.length; i++) {
				//initialize 2D array corresponding to board
				visited[i] = new Array(game.board.length).fill(false);
			}
			
			// loop through board and get list of all armies
			for (var i = 0; i < game.board.length; i++) {
				for (var j = 0; j < game.board.length; j++) {
					if (game.board[i][j] !== constants.empty && !visited[i][j]) {
						var army = new Set();
						//getArmy mutates army and visited
						//game.board[i][j] sets initial color for the recursion
						//j becomes x and i becomes y
						getArmy(j, i, game.board[i][j], game.board, army, visited);
						
						listOfAllArmies.push(army);}
					}
				}//end j
			}//end i
			
			*/
		}//end if(board not empty)
		
		const scores = getScore(game);
		//Move(x, y, color, capturedPieces, board, whiteScore, blackScore, pass)
		move = new Move(xPos, yPos, color, capturedPieces, game.board, scores.white, scores.black, false);
		
	}//end else (no pass)
		
	// turn done, switch turn state to opposite color
	game.turn = oppositeColor;

	game.moveHistory.push(move);
	return move;
		
}//end function makeMove
	
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

//this is done AFTER placing the player's piece and BEFORE removed captured
//should mutate nothing
function koRule(game,yPos,xPos,capturedPieces){
	//if move history does not exist
	if(game.moveHistory!==game.moveHistory || game.moveHistory.length === 0){
		throw new Error("Error at koRule: game.moveHistory does not exist. If this error is encountered while running test cases, make sure that hard-coded board arrangements have at least one item in moveHistory (even a pass should work)");
	}
	
	var newBoard = deepCopy(game.board);
		//capture
		for (var pieceString of capturedPieces) {
			let piece = JSON.parse(pieceString); // convert to object since army and captured pieces are JSON strings
			newBoard[piece.y][piece.x] = constants.empty;
		}
	
	var previousBoard = deepCopy(game.board);
		//undo current move
		previousBoard[yPos][xPos] = constants.empty;
		
		//undo 1 move from opposing player
		var prevMove = game.moveHistory[game.moveHistory.length-1];
		if(!prevMove.pass){
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
	
function getScore(game) {
    
    var blackScore = 0;
    var whiteScore = 0;
    var influence = [];
    for (var i = 0; i < game.board.length; i++) {
        influence[i] = new Array(game.board.length).fill(0);
    }
    
    for (var i = 0; i < game.board.length; i++) {
        for (var j = 0; j < game.board.length; j++) {
            if (game.board[i][j] == constants.black) {
                createBlackInfluence(i, j);    
            } 
            if (game.board[i][j] == constants.white) {
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

    function createBlackInfluence(i, j) {
        for (var y = 0; y < influence.length; y++) {
            for (var x = 0; x < influence.length; x++) {
                influence[y][x] += Math.round(game.board.length - Math.sqrt((x-i)*(x-i) + (y-i)*(y-i)));
            }
        }
    }

    function createWhiteInfluence(i, j) {
        for (var y = 0; y < influence.length; y++) {
            for (var x = 0; x < influence.length; x++) {
                influence[y][x] += Math.round(-game.board.length + Math.sqrt((x-i)*(x-i) + (y-i)*(y-i)));
            }
        }
    }
    
    return { white: whiteScore, black: blackScore };
}

/**
 * "Ends"" a game document. 
 *  Returns { winner: winner, scores: { black: int, white: int } }
 */
function endGame(game) {

    game.active = false;
    var scores = getScore(game);
    var winner = scores.white > scores.black ? constants.white : constants.black;

    return { winner: winner, scores: scores };
}


/**
 * This module's "public interface"
 */
module.exports = {
    makeMove: makeMove,
    GameException: GameException,
    DoublePassException: DoublePassException,
    getScore: getScore,
    endGame: endGame,
	
	//these shouldnt technically be public
	getArmy:getArmy,
	armyHasLiberties:armyHasLiberties,
	deepCopy:deepCopy,
	deepEquals:deepEquals
};
