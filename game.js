"use strict";

// enumerations
var COLOR = {
    white: 2,
    black: 1,
    empty: 0
}

/**
 * Returns a JSON "point". 
 * Used to create primitive values for points to 
 * allow lookup in Sets in constant time. 
 */
function point(x, y) {
    return JSON.stringify({"x": x, "y": y});
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
    
    if (size == undefined) {
        throw new GameException("Invalid GameDocument parameters: " + size);
    }
    this.board = [];
    this.turn = COLOR.black;
    for (var i = 0; i < size; i++) { // init board with empty
        this.board[i] = new Array(size).fill(COLOR.empty);
    }
    this.moveHistory = [];
}

function makeMove(xPos, yPos, color, game) {

    /*
    if (color != game.turn) {
        throw new GameException("Not your turn.");
    }

    if (game.board[yPos][xPos] != COLOR.empty) {
        throw new GameException("Occupied Place.");
    } */

    game.board[yPos][xPos] = color;  // update the board 
    var capturedPieces = [];

    
    // For all tiles with pieces on board, find armies to calculate liberties
    // append to capturedPieces if an army has no liberties
    for (var i = 0; i < game.board.length; i++) {
        for (var j = 0; j < game.board.length; j++) {
                
            if (game.board[i][j] != COLOR.empty) { // there is a piece on board        
                                
                // perform depth first search to get armies connected to this piece
                var army = new Set();       
                var pieceColor = game.board[i][j];

                // recursive depth-first search for armies
                (function getArmies(x, y, color) {              
                    if (x < 0 || x >= game.board.length || y < 0 || y >= game.board.length) { // out of bounds
                        return;
                    }
                    army.add(point(x, y));
                    
                    if (y + 1 < game.board.length && game.board[y + 1][x] == color && !army.has(point(x, y + 1))) {
                        getArmies(x, y + 1, color);
                    }
                    if (y - 1 >= 0 && game.board[y - 1][x] == color && !army.has(point(x, y - 1))) {
                        getArmies(x, y - 1, color);
                    } 
                    if (x + 1 < game.board.length && game.board[y][x + 1] == color && !army.has(point(x + 1, y))) {
                        getArmies(x + 1, y, color);
                    }
                    if (x - 1 >= 0 && game.board[y][x - 1] == color && !army.has(point(x - 1, y))) {
                        getArmies(x - 1, y, color);
                    }   
                    
                })(j, i, pieceColor);

                // calculate army's liberties                
                var liberties = 0;
                for (var node of army) {
                    node = JSON.parse(node);
                    var x = node.x;
                    var y = node.y;

                    var rightLiberty = x + 1 < game.board.length && game.board[y][x + 1] == COLOR.empty;
                    var leftLiberty = x - 1 >= 0 && game.board[y][x - 1] == COLOR.empty;
                    var northLiberty = y + 1 < game.board.length && game.board[y + 1][x] == COLOR.empty;
                    var southLiberty = y - 1 >= 0 && game.board[y - 1][x] == COLOR.empty;
                    
                    if ( rightLiberty || leftLiberty || northLiberty || southLiberty ) {
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
        piece = JSON.parse(piece);
        game.board[piece.y][piece.x] = COLOR.empty;
    }

    // convert "point" to object
    for (var i = 0; i < capturedPieces.length; i++) {
        capturedPieces[i] = JSON.parse(capturedPieces[i]);
    }

    var move = new Move(xPos, yPos, color, capturedPieces);
    game.moveHistory.push(move);

    printBoard(game.board);
    
    return move; 
}

function printBoard(board) {
    var boardString = "";
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
 * This module's public interface
 */
module.exports = {
    Game: Game,
    makeMove: makeMove,
    GameException: GameException
};
