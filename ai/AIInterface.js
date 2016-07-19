"use strict";
const http = require("http");
const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/ai/attackEnemy',
  method: 'POST',
  headers: {
      'Content-Type': 'application/json',
  }
};

const paths = ['/ai/maxLibs', '/ai/attackEnemy', '/ai/formEyes'];

class AIInterfaceException extends Error {
    constructor(message) {
        super(message);
    }
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
function query(game, callback) {
    const randomIndex = Math.floor(Math.random() * (paths.length - 1)); // choose random index for the ai paths
    options.path = paths[randomIndex]; 

    const lastMove = game.moveHistory[game.moveHistory.length - 1];
    const postData = {
        board: game.board,
        size: game.board.length,
        last: { x: lastMove.y, y: lastMove.x, pass: lastMove.pass, c: lastMove.color }
    };

    var req = http.request(options, function(res) {
        res.on('data', callback);
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    req.write(JSON.stringify(postData));
    req.end();
}

module.exports = {
  query : query
}