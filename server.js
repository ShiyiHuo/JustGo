var Game = require('./game.js')
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var EventEmitter = require('events').EventEmitter;
var messageBus = new EventEmitter();
var AIInterface = require('./AIInterface.js');

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

/**
 * Set up server
 */
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
    // TODO: also check if it is hotseat play and not clients turn. 
    // In that case emit an 'AI TURN' event here aswell
    
    MongoClient.connect(url, function(err, db) {
		assert.equal(null , err);
		db.collection('games').insertOne(newGame);
        res.json(newGame._id);
        res.end();
	});

});

/**
 * Period polling request from the client every 30 seconds.
 * The request is responded to when the AI is querried
 */
app.post("/longpoll", function(req, res, next) {
    console.log("longpoll request from client with sessionID: " + req.body.sessionID);
        
    messageBus.once('AI TURN', function(game) {

        var board = game.board;
        var size = game.board.length;
        var lastMove = game.moveHistory.pop();
        
        // format the JSON-input to the AI server
        // NOTE: the AI uses x to represent the rows (confusingly?) and they must be switched
        var formattedAIInput = { size: size,
                                board: board,
                                last: {x: lastMove.y, y: lastMove.x, pass: lastMove.pass, c : lastMove.color} }; 
                            
        AIInterface.queryAI(formattedAIInput, 
                            function (body) { 
                                console.log("AI RESPONDS WITH " + body);
                                
                                var aiMove = JSON.parse(body);
                                // NOTE: AI uses "x" for rows (confusingly?)
                                var boardUpdates = Game.makeMove(aiMove.y, aiMove.x, aiMove.c, game); 
                               
                                console.log("game = " + JSON.stringify(game));

                                // update game in database after AI move
                                MongoClient.connect(url, function(err, db) {
                                    var objectID = new ObjectID(req.body.sessionID);
                                    console.log("mongo connecting to document with objectID: " + objectID);
                                    assert.equal(null, err);
                                    db.collection('games').replaceOne({'_id': objectID}, game);

                                })
                               
                                console.log("responding to query with " + boardUpdates);
                                res.json(boardUpdates);
                                res.end();
                            }); 
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
            var boardUpdates = Game.makeMove(req.body.x, req.body.y, game.clientColor, game); // TODO: handle errors thown by makeMove
            
            console.log("after client move replacing game in database with: " + JSON.stringify(game));

            db.collection('games').replaceOne({'_id' : objectID}, game);

            res.json(boardUpdates);
            if (game.clientColor != game.turn && !game.hotseat) { //not in hotseat mode and its the AI's turn
                messageBus.emit('AI TURN', game); // this will query the AI and respond to long poll request
            }
            res.end();
        });
    });    

});
