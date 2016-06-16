// enumerations
var TURN = {
    white: 0,
    black: 1
}

var COLOR = {
    white: 0,
    black: 1,
    empty: -1
}

// state to be stored in the database in the future 
var turn = TURN.white
var size = 9;
var board = [];
for (var i = 0; i < size; i++) { // init board
    board[i] = new Array(size);
}

/**
 * Called by server under /move URI. 
 * Returns board updates
 */
function makeMove(x, y, color) {

    if ( __isLegalMove(x, y, color) ) {
        return [x, y];
    }

    throw "illegal move";   
}

/**
 * Called by makeMove
 * Returns true if move is legal, false if not
 */
function __isLegalMove(x, y, color) {

    return true;
}

/**
 * This module's public interface'
 */
module.exports = {
  makeMove: makeMove,
  COLOR: COLOR
};
