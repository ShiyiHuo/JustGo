"use strict";

// enumerations
var COLOR = {
    white: 0,
    black: 1,
    empty: -1
}

class Game {

    constructor() {
        this.turn = COLOR.black;
        this.clientColor = COLOR.black;
        this.size = 9;
        this.board = [];
        for (var i = 0; i < this.size; i++) { // init board
            this.board[i] = new Array(this.size);
        }
    }

    /**
     * make a move with given color. 
     * Error is thrown if the move is illegal or not color's turn
     */
    makeMove(x, y, color) {

        if (color != this.turn) {
            throw "illegal move";
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
        
        return [x, y, color];
    }

}

/**
 * This module's public interface'
 */
module.exports = {
    Game: Game
};
