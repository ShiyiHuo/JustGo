var Game = require('./game.js')
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var EventEmitter = require('events').EventEmitter;
var messageBus = new EventEmitter();

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

    var size = 9;
    var newGame = new Game.Game(size);
    
    MongoClient.connect(url, function(err, db) {
		assert.equal(null , err);
		db.collection('games').insertOne(newGame);
        res.json(newGame._id);
        res.end();
	});

});

/**
 * Period polling request from the client every 120 or so seconds.
 * The request is responded to when the AI is querried
 */
app.post("/longpoll", function(req, res, next) {
    console.log("longpoll request from client");
    
    messageBus.once('AI TURN', function(data) {
        console.log("responding to long poll request");
        res.json(data);

    });

});

/**
 * Sent when the client clicks the board.
 * The request should be in the format {x: x, y: y, sessionID: sessionID}
 */
app.post("/makeClientMove", function(req, res, next) {
    console.log("POST: /makeClientMove: ", JSON.stringify(req.body));
    
    MongoClient.connect(url, function(err, db) {
        assert.equal(null , err);
        
        // lookup game in database
        var objectID = new ObjectID(req.body.sessionID);
        db.collection('games').findOne({'_id' : objectID}, function(error, game) {
            
            // make requested move on game then replace game with updates in database
            var boardUpdates = Game.makeMove(req.body.x, req.body.y, game.turn, game); // TODO: handle errors thown by makeMove
            db.collection('games').replaceOne(
                {'_id' : objectID}, game
            ), 
            function(error, results) { 
                console.log("Finished replacing: " + results);
                db.close();
            }

            // send client board updates
            res.json(boardUpdates);

            // TODO: emit event if game.clientColor != game.turn && !hotseat to query AI
            // Note: we need to actually respond to the client with a separate message instead of this one (to show the AI's move)
            // since the clients must know if his/her move is legal and his/her timer stopped
            // and the AI's timer started. The AI may take a while to query a legal move.
            messageBus.emit('AI TURN', "data");


            res.end();
        });
    });    

});
