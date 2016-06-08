require('./GameModel');

// express configuration
var express = require("express");
var app = express();
app.use(express.static('public'));

var gameModel;

/**
 * request from client to login to their account
 */
app.post('/login', function(req, res) {
    console.log("POST request to: /login");

    res.end();
});

/**
 * request from client to start new game with chosen board size
 */
app.post('/new_game', function(req, res) {
    console.log("POST request to: /new_game");
    size = res.body.n;

    if (size) {
        gameModel = new GameModel(size);
    }
    else {
        res.end("you're an idiot");
        return;
    }

    res.end();
});

/**
 * request from client to when clicked on board position
 */
app.post('/client_move', function(req, res) {
    console.log("POST request to: /client_move");

    move = res.body;
    try {
        gameModel.whiteMove(move);
    } catch (Object) {
        res.end("that's not a legal good move bitch");
        return;
    }
   
    res.end();
});

/**
 * when it is the AI's turn the client polls the AI
 */
app.post('/poll_AI', function(req, res){
    console.log("POST request to: /poll_AI");

    // query ai
    aiMove = "a good move";

    try {
        gameModel.whiteMove(aiMove);
    } catch (Object) {
        res.end("that's not a legal good move bitch"); // need to try again
        return;
    }
    
    res.end();
});

app.listen(3000, function() {
	console.log('Listening on port 3000');
});