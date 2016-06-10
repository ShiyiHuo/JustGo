"use strict";

// enumeration of player turn state
const TURN = {
    black: 1,
    white: 2
};

// enumerate values of pieces on the matrix representation of board
const PIECE = {
    empty: 0,
    black: 1,
    white: 2
}

class Army {

}

class Stone {

}

class Player {

}

/**
 * stops game when time runs out. This can be done with setTimeout()'s in node JS which we can 
 * set to call a call back function which raises an exception or calls GameModel.endGame() 
 * */ 
class Timer {
    constructor(timeRemaining) {
        this.timeRemaining = timeRemaining;
    }
    start() {

    }
    stop() {

    }
}


/**
 * The model of the board's state. 
 * State is updated through the GameController via this class' public interface. 
 */
class GameModel {

    // start new game
   	constructor (size, mainTime, byoPeriod) {
        
        if (this.size % 2 == 0) {
            // throw error, illegal size
        }

        this.size = size;
        this.board = int[size][size]; 
        this.currentTurn = TURN.black;
        this.whiteTimer = new Timer(mainTime);
        this.blackTimer = new Timer(mainTime);
        this.whiteByo = new Timer(byoTime);
        this.blackByo = new TImer(byoPeriod);
        this.moveHistory = [];

        // init board ... does JS set arrays to 0 by default?
        for (i = 0; i < size; i++) { 
            for (j = 0; j < size; j++)
                board[i][j] = 0; 
        }

        // compare skill? 
        // set handicap?
    }

    /**
     * called by GameController after black player has computed a move 
     */
    makeBlackMove(x, y, color) {
        
     
    /**
     * returns true if legal move for the color, called by makeWhiteMove or makeBlackMove
     */
    isLegalMove(move, color) {
        return true;
    }

    endGame() { 
        
    }

};

module.exports = GameModel;