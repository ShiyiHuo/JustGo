"use strict";
const assert = require('assert');
const AIInterface = require('../ai/AIInterface');
const go = require('../game/go');
const constants = require('../game/constants')

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

function GameDocument(size, hotseatMode) {
  this.board = [];
  for (var i = 0; i < size; i++) {
    this.board[i] = new Array(size).fill(constants.empty);
  }
  this.turn = constants.black;
  this.moveHistory = [];
  this.hotseatMode = hotseatMode;
  this.clientColor = constants.black;
  this.active = true;
}


describe('AI Interface testing', function() {

    describe('Testing with size 19', function() {

        it('Black Move 0, 0', function(done) {
            const game = new GameDocument(19, false);
            go.makeMove(game, 0, 0, constants.black, false);
            const lastMove = game.moveHistory[game.moveHistory.length - 1];

            AIInterface.query({
                board: game.board,
                size: game.board.length,
                last: {x: lastMove.x, y: lastMove.y, pass: lastMove.pass, c: lastMove.color}
            }, function(data) {
                data = JSON.parse(data);
                go.makeMove(game, data.x, data.y, data.c, data.pass);
                console.log(data);
                done();
            });
        }); 
        
        it('Black Move 1, 1', function(done) {
            const game = new GameDocument(19, false);
            go.makeMove(game, 1, 1, constants.black, false);
            const lastMove = game.moveHistory[game.moveHistory.length - 1];

            AIInterface.query({
                board: game.board,
                size: game.board.length,
                last: {x: lastMove.x, y: lastMove.y, pass: lastMove.pass, c: lastMove.color}
            }, function(data) {
                JSON.parse(data);
                console.log(JSON.parse(data));
                done();
            });
        });
        
    });
})

