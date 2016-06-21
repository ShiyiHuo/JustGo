var Game = require('./game.js')
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var mode = "HOTSEAT";
var gameInstance;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// mongodb configuration
var ObjectID = require('mongodb').ObjectID;
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = 'mongodb://localhost:27017/GoData';
MongoClient.connect(url, function(err, db) {
	console.log("Connected correctly to mongodb server");
	db.close();
});

app.listen(30144, function() {
    console.log("Express listening on port 30144");
}); 

/**
 * Create a new game state and store it in database
 */
app.post("/newGame", function(req, res, next) {
    console.log("Received request for new game", JSON.stringify(req.body));

    res.write("Game #2");

    var newGame = new Game.Game(9);

    MongoClient.connect(url, function(err, db) {
		assert.equal(null , err);
		db.collection('games').insertOne(newGame);
		console.log("Posting: " + JSON.stringify(newGame) + " to games");
	});

    res.end(); // need to send ObjectID for the game created to be stored in cookie?
    next();
});

/**
 * Sent when the client clicks the board.
 * The request should be in the format {x: x, y: y, sessionID: sessionID}
 */
app.post("/makeClientMove", function(req, res, next) {
    console.log("POST: /makeClientMove: ", JSON.stringify(req.body));

    var move = req.body;  

    if (mode == "HOTSEAT") { // call makeMove with color equal to the current turn
        
        MongoClient.connect(url, function(err, db) {
		    assert.equal(null , err);
		    
            // lookup game in database
            var objectID = new ObjectID("5768b5dc5425e3092eb84038");
            db.collection('games').findOne({'_id' : objectID}, function(error, game) {
                
                // make requested move on game then replace game with updates in database
                var boardUpdates = Game.makeMove(move.x, move.y, game.turn, game);        
                db.collection('games').replaceOne(
                    {'_id' : objectID}, game
                ), 
                function(error, results) { 
                    console.log("Finished replacing: " + results);
                    db.close();
                }

                // send client board updates
                res.json(boardUpdates);
                res.end();
            });
        });    
    }

});
