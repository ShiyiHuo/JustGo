"use strict";
const constants = require('./constants.js');
const timer = require('./timer.js')

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
        console.log("GameException: " + message);
        this.message = message;
    }
}

/**
 * Make move on a game
 * 
 * @param game is a "Game" object
 * @param xPos is the row of the move
 * @param yPos is the column of the move
 * @param color is either black or white 
 * @param pass is bool
 * 
 * @return is a Move object
 */
function makeMove(game, xPos, yPos, color, pass) {
    
    // TODO: implement pass
    if (color != game.turn) {
        throw new GameException("Not your turn.");
        
    }
    if (game.board[yPos][xPos] != constants.empty) {
        throw new GameException("Occupied Place.");
    }   

    game.board[yPos][xPos] = color;  // update the board 

    var visited = [];
    for (var i = 0; i < game.board.length; i++) {
        visited[i] = new Array(game.board.length).fill(false);
    }

    // For all tiles with pieces on board, find armies to calculate liberties
    // append to capturedPieces if an army has no liberties
    var capturedPieces = [];
    for (var i = 0; i < game.board.length; i++) {
        for (var j = 0; j < game.board.length; j++) {
                
            if (game.board[i][j] != constants.empty && !visited[i][j]) { // there is a piece on this board "tile"  TODO: test auxillary matrix that stores if we've visited this piece so we don't have to do ever tile multiple times?     
                                
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
                    visited[i][j] = true;
                    
                    if (y+1 < game.board.length && game.board[y+1][x] == color && !army.has(point(x, y+1))) {
                        // north neighbor is piece of same color and we haven't added it to the army yet
                        getArmies(x, y+1, color);
                    }
                    if (y-1 >= 0 && game.board[y-1][x] == color && !army.has(point(x, y-1))) {
                        // south neighbor is piece of same color and we haven't added it to the army yet
                        getArmies(x, y-1, color);
                    } 
                    if (x+1 < game.board.length && game.board[y][x+1] == color && !army.has(point(x+1, y))) {
                        // west neighbor is piece of same color and we haven't added it to army yet
                        getArmies(x+1, y, color);
                    }
                    if (x-1 >= 0 && game.board[y][x-1] == color && !army.has(point(x-1, y))) {
                        // south neighbor is piece of same color and we haven't added it to army yet
                        getArmies(x-1, y, color);
                    }   
                    
                })(j, i, pieceColor);

                // calculate army's liberties                
                var liberties = 0;
                for (var node of army) {
                    node = JSON.parse(node); // convert back to object since army is composed of JSON strings 
                    var x = node.x;
                    var y = node.y;

                    var rightLiberty = x + 1 < game.board.length && game.board[y][x + 1] == constants.empty;
                    var leftLiberty = x - 1 >= 0 && game.board[y][x - 1] == constants.empty;
                    var northLiberty = y + 1 < game.board.length && game.board[y + 1][x] == constants.empty;
                    var southLiberty = y - 1 >= 0 && game.board[y - 1][x] == constants.empty;
                    
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
    if (game.turn == constants.black) {
        game.turn = constants.white;
    } else {
        game.turn = constants.black;
    }

    // remove captured pieces from board
    for (var piece of capturedPieces) {
        piece = JSON.parse(piece); // convert to object since army and captured pieces are JSON strings
        game.board[piece.y][piece.x] = constants.empty;
    }

    // convert the "point" JSON string back to object 
    // TODO: could this be put into above loop?
    for (var i = 0; i < capturedPieces.length; i++) {
        capturedPieces[i] = JSON.parse(capturedPieces[i]);
    }

    var move = new Move(xPos, yPos, color, capturedPieces);
    game.moveHistory.push(move);
    
    return { board: game.board, capturedPieces: capturedPieces }; 
}

/**
 * Returns true if the move is legal. False otherwise
 * 
 * @param game is a "Game" object
 * @param xPos is the row of the move
 * @param yPos is the colum nof the move
 * @param color is either white/black
 * @game pass is boolean
 * 
 * @ return boolean
 */
function isValidMove(game, xPos, yPos, color, pass) {

    if (color != game.turn) { // not player's turn
        return false;
    }

    if (game.board[yPos][xPos] != constants.empty) { // spot is already occupied
        return false;
    } 

    // TODO: check KO rule and suicide

    return true;
}

function getScore(game) {
    
    var blackScore = 0;
    var whiteScore = 0;
    var influence = [];
    for (var i = 0; i < game.board.length; i++) {
        influence[i] = new Array(game.board.length).fill(0);
    }
    
    for (var i = 0; i < game.board.length; i++) {
        for (var j = 0; j < game.board.length; j++) {
            if (game.board[i][j] == constants.black) {
                createBlackInfluence(i, j);    
            } 
            if (game.board[i][j] == constants.white) {
                createWhiteInfluence(i, j);
            }
        }
    }

    for (var i = 0; i < influence.length; i++) {
        for (var j = 0; j < influence.length; j++) {
            if (influence[i][j] > 0) {
                blackScore++;
            } else if (influence[i][j] < 0) {
                whiteScore++;
            }
        }
    }

    function createBlackInfluence(i, j) {
        for (var y = 0; y < influence.length; y++) {
            for (var x = 0; x < influence.length; x++) {
                influence[y][x] += Math.round(game.board.length - Math.sqrt((x-i)*(x-i) + (y-i)*(y-i)));
            }
        }
    }

    function createWhiteInfluence(i, j) {
        for (var y = 0; y < influence.length; y++) {
            for (var x = 0; x < influence.length; x++) {
                influence[y][x] += Math.round(-game.board.length + Math.sqrt((x-i)*(x-i) + (y-i)*(y-i)));
            }
        }
    }
    
    return {whiteScore: whiteScore, blackScore: blackScore};

}

/**
 * This module's "public interface"
 */
module.exports = {
    makeMove: makeMove,
    GameException: GameException,
    isValidMove: isValidMove,
    getScore: getScore
};
