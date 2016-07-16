"use strict";
const assert = require('chai').assert;
const go = require('../game/go.js');
const constants = require('../game/constants.js')

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

describe('Game of size 3 turn checking', function() {

    const game = new GameDocument(3, false);

    it('should not allow white to move initially', function(done) {
        let gameExceptionThrown = false;
        try {      
            go.makeMove(game, 0, 0, constants.white, false);
        } catch (err) {
            if (err instanceof go.GameException) {
                gameExceptionThrown = true;
            }
        }
        assert(gameExceptionThrown);
        assert.equal(game.board[0][0], constants.empty);
        done();
    });

    it('should switch turn from black to white after black move', function(done) {
        assert.equal(game.turn, constants.black);
        go.makeMove(game, 0, 0, constants.black, false);
        assert.equal(game.board[0][0], constants.black);
        assert.equal(game.turn, constants.white);
        done();
    });

    it('should not allow move from black after the black move', function(done) {
        let gameExceptionThrown = false;
        try {      
            go.makeMove(game, 1, 1, constants.black, false);
        } catch (err) {
            if (err instanceof go.GameException) {
                gameExceptionThrown = true;
            }
        }
        assert(gameExceptionThrown);
        assert.equal(game.board[1][1], constants.empty);
        done();      
    })

    it('should switch turn from white to black after white move', function(done) {
        assert.equal(game.turn, constants.white);
        go.makeMove(game, 1, 1, constants.white, false);
        assert.equal(game.board[1][1], constants.white);
        assert.equal(game.turn, constants.black);
        done();
    });
});

describe('game of size 3 double passing throw exception', function() {
    const game = new GameDocument(3, false);
    it('should allow first pass from black', function(done) {
        go.makeMove(game, null, null, constants.black, true);
        
        for (let i = 0; i < game.board.length; i++) 
            for (let j = 0; j < game.board.length; j++) 
                assert.equal(game.board[i][j], constants.empty);
            
        assert.equal(game.turn, constants.white);
        done();
    });

    it('should throw DoublePassException if white passes after black', function(done) {  
        let doublePassExceptionThrown = false;
        try {
            go.makeMove(game, null, null, constants.white, true);
        } catch (err) {
            if (err instanceof go.DoublePassException) {
                doublePassExceptionThrown = true;
            }
        }
        assert(doublePassExceptionThrown);
        done();
    });    
})


describe('game of size 3: passing is okay if not squential', function() {
    const game = new GameDocument(3, false);
    it('should allow first pass from black', function(done) {
        go.makeMove(game, null, null, constants.black, true);
        
        for (var row of game.board) 
            for (var tile of row) 
                assert.equal(tile, constants.empty);
        
        assert.equal(game.turn, constants.white);
        done();
    });

    it('should allow next move from white', function(done) {
        go.makeMove(game, 0, 0, constants.white, false);
        assert.equal(game.board[0][0], constants.white);
        done();
    })

    it('should allow pass from black again', function(done) {
        go.makeMove(game, null, null, constants.black, true);
        assert.equal(game.turn, constants.white);
        done();
    })

})


describe('game of size 3 board checking', function() {
    
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
        assert.equal(game.board[0][0], constants.black);
        assert.equal(game.turn, constants.black);
        assert(gameExceptionThrown);
    }); 
    
});


describe("Game of size 5: capturing and suicide", function() {

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


});


