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

const paths = ['/ai/maxlibs', '/ai/attackEnemy', '/ai/formEyes'];

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
function query(postData, callback) {
    var randomIndex = Math.floor(Math.random() * (paths.length - 1));
    options.path = paths[randomIndex]; // ????

    var req = http.request(options, function(res) {
        res.on('data', callback);
    });

    req.on('socket', function (socket) {
        socket.setTimeout(5 * 1000);  
        socket.on('timeout', function() {
            console.log("AI took too long to respond");
            callback()
            req.abort();
        });
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