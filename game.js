"use strict";

// enumerations
var COLOR = {
    white: 2,
    black: 1,
    empty: 0
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

    }

    /**
     * make a move with given color. 
     * Error is thrown if the move is illegal or not color's turn
     */
    makeMove(x, y, color) {

        if (color != this.turn) {
            throw GameException("Not your turn.");
        }

        // TODO: check legal move, throw error if illegal

        // update the board 
        // TODO: append to move history?
        this.board[x][y] = color;  
       
        // switch turn state to opposite color
        if (this.turn == COLOR.black) {
            this.turn = COLOR.white;
        } else {
            this.turn = COLOR.black;
        }
        
        this.printBoard();

        // TODO: needs to return updates
        return [x, y, color];
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
 * This module's public interface'
 */
module.exports = {
    Game: Game,
    GameException: GameException
};
