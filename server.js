var Game = require('./game.js')
var express = require("express");
var bodyParser = require("body-parser")
var app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.listen(30144, function() {
    console.log("Express listeningo on port 30144");
}); 

app.post("/newGame", function(req, res, next) {
    console.log("Received request for new game", JSON.stringify(req.body));
    res.write("Game #2");
    res.end();
    next();
});

app.post("/move", function(req, res, next) {
    console.log("Received turn: ", JSON.stringify(req.body));
    
    move = req.body;
    var boardUpdates = Game.makeMove(move.x, move.y, Game.COLOR.black);
    res.json(boardUpdates);

    res.end();
    next();
});
