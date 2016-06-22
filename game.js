"use strict";

// enumerations
var COLOR = {
    white: 2,
    black: 1,
    empty: 0
}

/**
 * Returned to client after a valid move. 
 * Contains information needed for view to update.
 */
class Move {
    constructor(x, y, color, capturedPieces) {
        this.x = x;
        this.y = y; 
        this.color = color;
        this.pass = false;
        this.capturedPieces = capturedPieces;
    }
}

/**
 * Provides an exception class for Game 
 */
class GameException {
    constructor(message) {
        this.message = message;
    }
}

function Game(size) {
    if (!size || size % 2 == 0) {
        throw new GameException("Invalid Game parameters: " + size);
    }
    this.board = [];
    this.turn = COLOR.black;
    for (var i = 0; i < size; i++) { // init board with empty
        this.board[i] = new Array(size).fill(COLOR.empty);
    }
    this.moveHistory = [];
    this.hotseatMode = false;
    this.clientColor = COLOR.black;
}

function makeMove(xPos, yPos, color, game) {
    
    if (color != game.turn) {
        console.log("ERROR NOT YOUR TURN");
        throw new GameException("Not your turn.");
    }

    if (game.board[yPos][xPos] != COLOR.empty) {
        console.log("ERROR OCCUPIED INTERSECTION");
        throw new GameException("Occupied Place.");
    }   

    game.board[yPos][xPos] = color;  // update the board 
    var capturedPieces = [];

    
    // For all tiles with pieces on board, find armies to calculate liberties
    // append to capturedPieces if an army has no liberties
    for (var i = 0; i < game.board.length; i++) {
        for (var j = 0; j < game.board.length; j++) {
                
            if (game.board[i][j] != COLOR.empty) { // there is a piece on this board "tile"        
                                
                // perform depth first search to get armies connected to this piece
                var army = new Set();       
                var pieceColor = game.board[i][j];

                // recursive depth-first search for armies
                (function getArmies(x, y, color) {              
                    if (x < 0 || x >= game.board.length || y < 0 || y >= game.board.length) { // out of bounds
                        return;
                    }

                     // Returns a JSON-string representation of a "point". 
                     // Strings are used to create primitive values for points to allow lookup in Sets in constant time. 
                    function point(x, y) {
                        return JSON.stringify({"x": x, "y": y});
                    }
                    army.add(point(x, y));
                    
                    if (y + 1 < game.board.length && game.board[y + 1][x] == color && !army.has(point(x, y + 1))) {
                        // north neighbor is piece of same color and we haven't added it to the army yet
                        getArmies(x, y + 1, color);
                    }
                    if (y - 1 >= 0 && game.board[y - 1][x] == color && !army.has(point(x, y - 1))) {
                        // south neighbor is piece of same color and we haven't added it to the army yet
                        getArmies(x, y - 1, color);
                    } 
                    if (x + 1 < game.board.length && game.board[y][x + 1] == color && !army.has(point(x + 1, y))) {
                        // west neighbor is piece of same color and we haven't added it to army yet
                        getArmies(x + 1, y, color);
                    }
                    if (x - 1 >= 0 && game.board[y][x - 1] == color && !army.has(point(x - 1, y))) {
                        // south neighbor is piece of same color and we haven't added it to army yet
                        getArmies(x - 1, y, color);
                    }   
                    
                })(j, i, pieceColor);

                // calculate army's liberties                
                var liberties = 0;
                for (var node of army) {
                    node = JSON.parse(node); // convert back to object since army is composed of JSON strings 
                    var x = node.x;
                    var y = node.y;

                    var rightLiberty = x + 1 < game.board.length && game.board[y][x + 1] == COLOR.empty;
                    var leftLiberty = x - 1 >= 0 && game.board[y][x - 1] == COLOR.empty;
                    var northLiberty = y + 1 < game.board.length && game.board[y + 1][x] == COLOR.empty;
                    var southLiberty = y - 1 >= 0 && game.board[y - 1][x] == COLOR.empty;
                    
                    if (rightLiberty || leftLiberty || northLiberty || southLiberty) {
                        liberties++;
                    }
                } 

                // army is captured if it has no liberties
                if (liberties == 0) {
                    capturedPieces = Array.from(army);
                }

            }
        }
    }

    // switch turn state to opposite color
    if (game.turn == COLOR.black) {
        game.turn = COLOR.white;
    } else {
        game.turn = COLOR.black;
    }

    // remove captured pieces from board
    for (var piece of capturedPieces) {
        piece = JSON.parse(piece); // convert to object since army and captured pieces are JSON strings
        game.board[piece.y][piece.x] = COLOR.empty;
    }

    // convert the "point" JSON string back to object 
    // TODO: could this be put into above loop?
    for (var i = 0; i < capturedPieces.length; i++) {
        capturedPieces[i] = JSON.parse(capturedPieces[i]);
    }

    var move = new Move(xPos, yPos, color, capturedPieces);
    game.moveHistory.push(move);
    
    return move; 
}

/**
 * Returns true if the move is legal. False otherwise
 */
function isValidMove(xPos, yPos, color, game) {

    if (color != game.turn) { // not player's turn
        return false;
    }

    if (game.board[yPos][xPos] != COLOR.empty) { // spot is already occupied
        return false;
    } 

    // TODO: check KO rule and suicide

    return true;
}


/**
 * Logs matrix representation of board to console with 0-empty, 1-black, 2-white
 */
function printBoard(board) {
    var boardString = "BOARD:\n";
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            boardString += board[i][j] + " ";
        }
        if (i < board.length - 1) {
            boardString += "\n";
        }       
    }
    console.log(boardString);
}

/**
 * This module's "public interface"
 */
module.exports = {
    Game: Game,
    makeMove: makeMove,
    GameException: GameException,
    isValidMove: isValidMove
};
