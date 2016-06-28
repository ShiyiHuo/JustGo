var assert = require('assert');
var go = require('../game/go.js');
var constants = require('../game/constants.js');



// size 9
var game = new go.game(9);
go.makeMove(game, 0, 0, game.turn, false);

