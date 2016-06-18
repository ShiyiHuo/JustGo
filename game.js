"use strict";

// enumerations
var COLOR = {
    white: 2,
    black: 1,
    empty: 0
}

function point(x, y) {
    return JSON.stringify({"x": x, "y": y});
}

class Move {
    constructor(x, y, color, capturedPieces) {
        this.x = x;
        this.y = y; 
        this.color = color;
        this.capturedPieces;
    }
}

class GameException {
    constructor(message) {
        this.message = message;
    }
}

class Game {
    constructor() {
        this.turn = COLOR.black; // whos turn it is (white or black)
        this.clientColor = COLOR.black; // used to emit event to query AI: when (clientColor != turn)?
        this.size = 9; // board size, should be odd
        this.board = []; 
        this.moveHistory = []; // for ko rule and replay
        for (var i = 0; i < this.size; i++) { // init board with empty
            this.board[i] = new Array(this.size).fill(COLOR.empty);
        }
    }

    /**
     * make a move with given color. 
     * Error is thrown if the move is illegal or not color's turn
     */
    makeMove(xPos, yPos, color) {

        if (color != this.turn) {
            throw new GameException("Not your turn.");
        }

        if (this.board[yPos][xPos] != COLOR.empty) {
            throw new GameException("Occupied Place.");
        }

        this.board[yPos][xPos] = color;  // update the board 
        var capturedPieces = [];

        // For all tiles with pieces on board, find armies to calculate liberties
        // append to capturedPieces if an army has no liberties
        for (var i = 0; i < this.board.length; i++) {
            for (var j = 0; j < this.board.length; j++) {
                   
                if (this.board[i][j] != COLOR.empty) {            
                                 
                    // init previously visited for depth first search
                    var previouslyVisited = new Set();

                    // perform depth first search to get armies connected to this piece
                    var pieceColor = this.board[i][j];

                    getArmies.call(this, j, i, pieceColor); 
                    function getArmies(x, y, color) {
                        
                        if (x < 0 || x >= this.board.length || y < 0 || y >= this.board.length) { // out of bounds
                            return;
                        }
                        previouslyVisited.add(point(x, y));
                        
                        if (y + 1 < this.board.length && this.board[y + 1][x] == color && !previouslyVisited.has(point(x, y + 1))) {
                            getArmies.call(this, x, y + 1, color);
                        }
                        if (y - 1 >= 0 && this.board[y - 1][x] == color && !previouslyVisited.has(point(x, y - 1))) {
                            getArmies.call(this, x, y - 1, color);
                        } 
                        if (x + 1 < this.board.length && this.board[y][x + 1] == color && !previouslyVisited.has(point(x + 1, y))) {
                            getArmies.call(this, x + 1, y, color);
                        }
                        if (x - 1 >= 0 && this.board[y][x - 1] == color && !previouslyVisited.has(point(x - 1, y))) {
                            getArmies.call(this, x - 1, y, color);
                        }   
                        
                    }

                    // calculate army's liberties                
                    var liberties = 0;
                    for (var node of previouslyVisited) {
                        node = JSON.parse(node);
                        var x = node.x;
                        var y = node.y;

                        var rightLiberty = x + 1 < this.board.length && this.board[y][x + 1] == COLOR.empty;
                        var leftLiberty = x - 1 >= 0 && this.board[y][x - 1] == COLOR.empty;
                        var northLiberty = y + 1 < this.board.length && this.board[y + 1][x] == COLOR.empty;
                        var southLiberty = y - 1 >= 0 && this.board[y - 1][x] == COLOR.empty;
                        if ( rightLiberty || leftLiberty || northLiberty || southLiberty ) {
                            liberties++;
                        }
                    } 

                    if (liberties == 0) {
                        capturedPieces = Array.from(previouslyVisited);
                    }

                }
            }
        }

        // switch turn state to opposite color
        if (this.turn == COLOR.black) {
            this.turn = COLOR.white;
        } else {
            this.turn = COLOR.black;
        }

        // remove captured pieces from board
        for (var piece of capturedPieces) {
            piece = JSON.parse(piece);
            this.board[piece.y][piece.x] = COLOR.empty;
        }

        // convert "point" to object
        for (var i = 0; i < capturedPieces.length; i++) {
            capturedPieces[i] = JSON.parse(capturedPieces[i]);
        }

        // TODO: append move to history?
        var move = new Move(xPos, yPos, color, capturedPieces);
        move.capturedPieces = capturedPieces; // I think you have to add lists to objects this way?

        this.printBoard();

        return move;
    }

    /**
     * logs board to console (for debug)
     */
    printBoard() {
        var boardString = "";
        for (var i = 0; i < this.board.length; i++) {
            for (var j = 0; j < this.board.length; j++) {
                boardString += this.board[i][j] + " ";
            }
            boardString += "\n";
        }
        console.log(boardString);
    }

}

/**
 * This module's public interface
 */
module.exports = {
    Game: Game,
    GameException: GameException
};
