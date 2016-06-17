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

    makeMove(x, y, color) {

        this.board[x][y] = color;  
       
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
