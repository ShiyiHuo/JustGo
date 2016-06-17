var Game = require('./game.js')
var express = require("express");
var bodyParser = require("body-parser")
var app = express();
var mode = "HOTSEAT";
var gameInstance;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.listen(30144, function() {
    console.log("Express listeningo on port 30144");
}); 

app.post("/newGame", function(req, res, next) {
    console.log("Received request for new game", JSON.stringify(req.body));
    res.write("Game #2");

    gameInstance = new Game.Game();

    res.end();
    next();
});

app.post("/makeClientMove", function(req, res, next) {
    console.log("POST: /makeClientMove: ", JSON.stringify(req.body));

    move = req.body;  

    if (mode == "HOTSEAT") { // call Game class with color equal to the current turn
        
        try {
            var boardUpdates = gameInstance.makeMove(move.x, move.y, gameInstance.turn);  
            res.json(boardUpdates);      
        } catch (error) {
            if (error instanceof Game.GameException) {
                res.json("Illegal Move");
            } else { // uncaught exception
                throw (error);
            }    
        }
        
    } 

    res.end();
    next();
});
