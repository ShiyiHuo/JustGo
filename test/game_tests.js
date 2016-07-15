var assert = require('chai').assert;
var go = require('../game/go.js');
var constants = require('../game/constants.js')


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

describe('Game of size 3: turn/color checking', function() {

  describe('makeMove()', function () {
    it('should start off with black move then switch to white', function() {
      var game = new GameDocument(3, false);
      assert.equal(game.turn, constants.black);
      go.makeMove(game, 0, 0, constants.black, false);
      assert.equal(game.turn, constants.white);
      
    });

    
    it('should update the board', function() {
      for (var y = 0; y < 3; y++) {
        for (var x = 0; x < 3; x++) {
          var game = new GameDocument(3, false);
          assert.equal(game.board[y][x], constants.empty);
          go.makeMove(game, x, y, constants.black, false);
          assert.equal(game.board[y][x], constants.black);
        }
      }
    });

    it('should not allow move from black twice in a row', function() {
      var game = new GameDocument(3, false);
      go.makeMove(game, 0, 0, constants.black, false);
      
      var gameExceptionThrown = false;
      try {
        go.makeMove(game, 1, 1, constants.black, false);
      } catch (e) {
        if (e instanceof go.GameException) {
          gameExceptionThrown = true; 
        }
      }
      assert(gameExceptionThrown);
    });

    it('should allow move from white after black', function() {
      var game = new GameDocument(3, false);
      go.makeMove(game, 0, 0, constants.black);
      go.makeMove(game, 1, 1, constants.white);
      assert.equal(game.turn ,constants.black);
    });

    it('should not allow move onto occupied place', function() { // this test doesn't work
      var gameExceptionThrown = false;
      var game = new GameDocument(3, false);
      game.board[0][0] = constants.black;

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
      var game = new GameDocument(5, false);
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
      var game = new GameDocument(5, false);
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
    var game = new GameDocument(5, false);

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
      var exceptionThrown = false;
      try {
        go.makeMove(game, 2, 1, B, false);
      } catch (err) {
        if (err instanceof go.GameException) {
          exceptionThrown = true;
        }
      }
      assert(exceptionThrown);
    });

  });
});

describe('Game of Size 9', function() {
    
    it('should not allow suicide on a large board', function() {
      var game = new GameDocument(9, false);
     game.board = [ [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                    [ 0, 0, 0, 0, 2, 0, 0, 0, 0 ],
                    [ 0, 1, 1, 2, 0, 2, 0, 0, 0 ],
                    [ 2, 1, 1, 1, 2, 0, 0, 0, 0 ],
                    [ 0, 0, 1, 2, 0, 0, 0, 0, 0 ],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ] ];
      var exceptionThrown = false;
      try {
        go.makeMove(game, 4, 2, constants.black, false);
      } catch (err) {
        if (err instanceof go.GameException) {
          exceptionThrown = true;
        }
      }
      assert(exceptionThrown);
      assert.equal(game.turn, constants.black);
 
      game.board = [[ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                    [ 2, 2, 0, 0, 0, 0, 0, 0, 0 ],
                    [ 0, 0, 2, 2, 1, 0, 0, 0, 0 ],
                    [ 0, 2, 1, 0, 0, 0, 0, 0, 0 ],
                    [ 2, 2, 1, 0, 0, 0, 0, 0, 0 ],
                    [ 1, 0, 2, 1, 0, 0, 0, 0, 0 ],
                    [ 2, 2, 0, 0, 0, 0, 0, 0, 0 ] ];
     var ethrown = false;
     try {
      go.makeMove(game, 1, 7, constants.black, false);
     } catch (err) {
       ethrown = true;
     }
     assert(ethrown)
     assert.equal(game.turn, constants.black);

    });

    it('should not allow repated move (KO)', function() {
      assert(false); // how to test again?
    })    
});


