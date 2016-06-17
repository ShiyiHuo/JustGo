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
        for (var i = 0; i < this.size; i++) { // init board
            this.board[i] = new Array(this.size).fill(COLOR.empty);
        }
        this.previouslyVisited;
    }

    /**
     * make a move with given color. 
     * Error is thrown if the move is illegal or not color's turn
     */
    makeMove(xPos, yPos, color) {

        if (color != this.turn) {
            throw GameException("Not your turn.");
        }

        // TODO: check legal move, throw error if illegal
        // TODO: append to move history?
        this.board[yPos][xPos] = color;  // update the board 
        this.printBoard(); 

        var capturedPieces = [];

        for (var i = 0; i < this.size; i++) {
            for (var j = 0; j < this.size; j++) {
                if (this.board[i][j] != COLOR.empty) {
                    var tileColor = this.board[i][j];
                    this.clearPreviouslyVisited();
                    this.getArmies(i, j, tileColor);     

                    var liberties = 0;

                    console.log(this.previouslyVisited);
                    
                    for (var y = 0; y < this.size; y++) {
                        for (var x = 0; x < this.size; x++) {
                            if (this.previouslyVisited[x][y]) {

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

                    if (liberties == 0) {
                        console.log("SHOULD REMOVE: " + this.previouslyVisited);

                        for (var y = 0; y < this.size; y++) {
                            for (var x = 0; x < this.size; x++) {
                                if (this.previouslyVisited[x][y]) {
                                    capturedPieces.push(new Point(x, y));
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

        // TODO: needs to return updates
        return [xPos, yPos, color, capturedPieces];
    }

    clearPreviouslyVisited() {
        this.previouslyVisited = [];
        for (var i = 0; i < this.size; i++) { 
            this.previouslyVisited[i] = new Array(this.size).fill(false);
        }
    }

    getArmies(x, y, color) {

        if (x < 0 || x > this.size || y < 0 || y > this.size) {
            return;
        }

        this.previouslyVisited[x][y] = true;
        if (y + 1 < this.size && this.board[x][y + 1] == color && !this.previouslyVisited[x][y + 1]) {
            this.getArmies(x, y + 1, color);
        }
        if (y - 1 >= 0 && this.board[x][y - 1] == color && !this.previouslyVisited[x][y - 1]) {
            this.getArmies(x, y - 1, color);
        }
        if (x + 1 < this.size && this.board[x + 1][y] == color && !this.previouslyVisited[x + 1][y]) {
            this.getArmies(x + 1, y, color);
        }
        if (x - 1 >= 0 && this.board[x - 1][y] == color && !this.previouslyVisited[x - 1][y]) {
            this.getArmies(x - 1, y, color);
        }

    }

    printBoard() {
        var boardString = "";
        for (var i = 0; i < this.size; i++) {
            for (var j = 0; j < this.size; j++) {
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
