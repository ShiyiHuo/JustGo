"use strict";
const assert = require('assert');
const AIInterface = require('../ai/AIInterface');
const constants = require('../constants');
const Game = require('../Game');

function newGame(size, hotseat) {
    let board = [];
    for (var i = 0; i < size; i++) {
        board[i] = new Array(size).fill(constants.empty);
    }

    const game = new Game({
        board: board,
        turn: constants.black,
        moveHistory: [],
        hotseatMode: hotseat,
        clientColor: constants.black,
        active: true,
        winner: null,
        whiteMsRemaining: constants.startingTimePool,
        blackMsRemaining: constants.startingTimePool,
        username: 'guest'
    });

    return game;
}

/**
 * Post request to AI Server
 * 
 * @param postData should be in the format: 
    { board: [[1,0,0], [0,0,0], [0,0,0]],
      size: 3,
      last: {x:0, y:0, pass : false, c : 1} };
 *   
 * @param callback is executed when the AI returns a move
 */
describe('AI Interface testing', function() {

    describe('Testing with size 19', function() {

        it('Black Move 0, 0', function(done) {
            const game = newGame(19, false);
            game.makeMove(0, 0, constants.black, false);

            AIInterface.query(game, function(data) {
                game.makeMove(data.x, data.y, data.c, data.pass);
                console.log(data);
                done();
            });
        }); 
        
        it('Black Move 1, 1', function(done) {
            const game = newGame(19, false);
            game.makeMove(1, 1, constants.black, false);

            AIInterface.query(game, function(data) {
                done();
            });
        });
        
    });
})

