var http = require("http");
var options = {
  hostname: '127.0.0.1',
  port: 30144,
  path: '/',
  method: 'GET',
  headers: {
      "Content-Type": "application/json"
  }
};

http.request(options, function(res) {
  console.log("response");
});


