"use strict";

// enumerations
var COLOR = {
    white: 2,
    black: 1,
    empty: 0
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
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
        this.turn = COLOR.black;
        this.clientColor = COLOR.black;
        this.size = 9;
        this.board = [];
        this.moveHistory = [];
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

        if (this.board[xPos][yPos] != COLOR.empty) {
            throw new GameException("Illegal Move.");
        }

        this.board[yPos][xPos] = color;  // update the board 
        var capturedPieces = [];

        // For all tiles with pieces on board, find armies to calculate liberties
        // append to capturedPieces if an army has no liberties
        for (var i = 0; i < this.board.length; i++) {
            for (var j = 0; j < this.board.length; j++) {
                   
                if (this.board[i][j] != COLOR.empty) {            
                                 
                    // init previously visited for depth first search
                    var previouslyVisited = [];
                    for (var k = 0; k < this.size; k++) { 
                        previouslyVisited[k] = new Array(this.size).fill(false);
                    }

                    // perform depth first search to get armies connected to this piece
                    var pieceColor = this.board[i][j];
                    getArmies.call(this, i, j, pieceColor);

                    function getArmies(x, y, color) {
                        if (x < 0 || x >= this.board.length || y < 0 || y >= this.board.length) {
                            return;
                        }
                        previouslyVisited[x][y] = true;
                        if (y + 1 < this.board.length && this.board[x][y + 1] == color && !previouslyVisited[x][y + 1]) {
                            getArmies.call(this, x, y + 1, color);
                        }
                        if (y - 1 >= 0 && this.board[x][y - 1] == color && !previouslyVisited[x][y - 1]) {
                            getArmies.call(this, x, y - 1, color);
                        }
                        if (x + 1 < this.board.length && this.board[x + 1][y] == color && !previouslyVisited[x + 1][y]) {
                            getArmies.call(this, x + 1, y, color);
                        }
                        if (x - 1 >= 0 && this.board[x - 1][y] == color && !previouslyVisited[x - 1][y]) {
                            getArmies.call(this, x - 1, y, color);
                        } 
                    }

                    // after performing depth first search, iterate through army and sum liberties
                    var liberties = 0;
                    for (var y = 0; y < this.size; y++) {
                        for (var x = 0; x < this.size; x++) {
                            if (previouslyVisited[x][y]) {
                                var rightLiberty = x + 1 < this.size && this.board[x + 1][y] == COLOR.empty;
                                var leftLiberty = x - 1 >= 0 && this.board[x - 1][y] == COLOR.empty;
                                var northLiberty = y + 1 < this.size && this.board[x][y + 1] == COLOR.empty;
                                var southLiberty = y - 1 >= 0 && this.board[x][y - 1] == COLOR.empty;
                                if ( rightLiberty || leftLiberty || northLiberty || southLiberty ) {
                                    liberties++;
                                }
                            }
                        }
                    }

                    // if no liberties the pieces are captured
                    if (liberties == 0) {
                        for (var y = 0; y < this.size; y++) {
                            for (var x = 0; x < this.size; x++) {
                                if (previouslyVisited[x][y]) {
                                    capturedPieces.push(new Point(y, x));
                                }
                            }
                        }
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
            this.board[piece.x][piece.y] = COLOR.empty;
        }
        // TODO: append move to history?

        var move = new Move(xPos, yPos, color, capturedPieces);
        move.capturedPieces = capturedPieces; // I think you have to add lists to objects this way?

        return move;
    }

}

/**
 * This module's public interface
 */
module.exports = {
    Game: Game,
    GameException: GameException
};
