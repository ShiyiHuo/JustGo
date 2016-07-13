var assert = require('chai').assert;
var go = require('../game/go');
var constants = require('../game/constants');

function Game(size) {
    this.size = size;
    this.board = [];
    for (var i = 0; i < size; i++) {
        this.board[i] = new Array(size).fill(constants.empty);
    }
}


var game = new Game(5);


for (var i = 0; i < game.board.length; i++) {
    for (var j = 0; j < game.board.length; j++) {
        var color = Math.round(Math.random() * 2);
        game.board[i][j] = color;
    }
}

var scores = go.getScore(game);
console.log(game.board);
console.log(scores);



/*
describe('Scoring tests', function() {
    it('should score properly', function() {
        var game = new Game(9);
        go.getScore(game);
    })
}) */