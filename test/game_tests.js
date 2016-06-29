var assert = require('chai').assert;
var go = require('../game/go.js');
var constants = require('../game/constants.js')

describe('Game of size 3: turn/color checking', function() {

  var game = new go.Game(3, false);

  describe('makeMove()', function () {
    it('should start off with black\'s move', function() {
      assert.equal(game.turn, constants.black);
    });

    it('should allow black move without exception', function() {
      assert.equal(game.board[0][0], constants.empty);
      go.makeMove(game, 0, 0, constants.black, false);
      assert.equal(game.board[0][0], constants.black);
    });

    it('should change to white\'s move now', function() {
      assert.equal(game.turn, constants.white);
    })

    it('should not allow move from black again', function() {
      assert.equal(game.turn, constants.white);
      var gameExceptionThrown = false;
      try {
        go.makeMove(game, 0, 0, constants.black, false);
      } catch (e) {
        if (e instanceof go.GameException) {
          gameExceptionThrown = true; 
        }
      }
      assert(gameExceptionThrown);
    });
    
    it('should allow move from white', function() {
      assert.equal(game.turn, constants.white);
      go.makeMove(game, 1, 1, constants.white, false);
      assert.equal(game.turn, constants.black);
    });

    it('should not allow move onto occupied place', function() { // this test doesn't work
      var gameExceptionThrown = false;
      try {
        go.makeMove(game, 0, 0, constants.black, false);
      } catch (e) {
        if (e instanceof go.GameException) {
          gameExceptionThrown = true; 
        }
      } 
      assert(gameExceptionThrown);
    });
  });
});

describe("Game of size 5", function() {

  describe('makeMove() capture pieces testing', function() {
    it('Should capture piece at (1, 1)', function() {
      var game = new go.Game(5, false);
      var W = constants.white;
      var B = constants.black;
      game.board = [[0, B, 0, 0, 0],
                    [B, W, 0, 0, 0],
                    [0, B, 0, 0, 0],
                    [0, 0, 0, 0, 0]
                    [0, 0, 0, 0, 0]];

      go.makeMove(game, 2, 1, B, false);
      assert.equal(game.board[1][1], constants.empty);
    });

    it('Should capture pieces at (3, 1) and (2, 1)', function() {
      var game = new go.Game(5, false);
      var W = constants.white;
      var B = constants.black;
      game.board = [[0, B, B, 0, 0],
                    [B, W, W, 0, 0],
                    [0, B, B, 0, 0],
                    [0, 0, 0, 0, 0]
                    [0, 0, 0, 0, 0]];

      go.makeMove(game, 3, 1, B, false);
      assert.equal(game.board[1][1], constants.empty);
      assert.equal(game.board[1][2], constants.empty);
    });
  });

  describe("isValidMove() determines if move is legal", function() {
    var game = new go.Game(5, false);

    var W = constants.white;
    var B = constants.black;

    it('should not allow white turn to start', function() {
       var valid = go.isValidMove(game, 0, 0, W, false);
       assert(!valid);
    });

    it('should allow black to start', function() {
       var valid = go.isValidMove(game, 0, 0, B, false);
       assert(valid);
    });

    it('should allow black to start', function() {
       var valid = go.isValidMove(game, 0, 0, B, false);
       assert(valid);
    })

    game.board = [[0, B, B, 0, 0],
                  [B, W, W, 0, 0],
                  [0, B, B, 0, 0],
                  [0, 0, 0, 0, 0]
                  [0, 0, 0, 0, 0]];

    it('should not allow move onto occupied place', function() {
      var valid = go.isValidMove(game, 1, 1, B, false);
      assert(!valid);
    });

    game.board = [[0, 0, W, 0, 0],
                  [0, W, 0, W, 0],
                  [0, 0, W, 0, 0],
                  [0, 0, 0, 0, 0]
                  [0, 0, 0, 0, 0]];

    it('should not allow suicide', function() {
      var valid = go.isValidMove(game, 2, 1, B, false);
      assert(!valid);
    });

    game.board = [[0, 0, W, 0, 0],
                  [0, W, 0, W, 0],
                  [0, 0, W, 0, 0],
                  [0, 0, 0, 0, 0]
                  [0, 0, 0, 0, 0]];

    it('should not allow repated move (KO)', function() {
      assert(false); // how to test again?
    })    
  });
});

describe("Game of size 7 doing timer tests", function() {
  var game = new go.Game(7, false);
  var W = constants.white;
  var B = constants.black;

  it('should keep track of black player time', function() {
    game.blackTimer.getTime();
    setTimeout(function() {
      go.makeMove(game, 0, 0, B);
      game.blackTimer.getTime();
      done();
    }, 5000);
  });

  it('should keep track of white player time', function() {
    game.whiteTimer.getTime();
    setTimeout(function() {
      go.makeMove(game, 1, 1, W);
      game.whiteTimer.getTime();
      done();
    }, 5000);
  });

})
