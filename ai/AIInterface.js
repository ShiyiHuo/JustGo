var http = require("http");
var options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/ai/maxLibs',
  method: 'POST',
  headers: {
      'Content-Type': 'application/json',
  }
};

/**
 * Post request to AI Server
 * postData should be in the format: 
    { board: [[1,0,0],[0,0,0],[0,0,0]],
      size: 3,
      last: {x:0, y:0, pass : false, c : 1} };
 *   
 * callback is executed when the AI returns a move
 */
function queryAI(postData, callback) {
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
  queryAI : queryAI
}