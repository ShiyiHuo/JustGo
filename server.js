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
    console.log("POST: /newGame " + JSON.stringify(req.body));

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
 * The request is responded to with move data when the AI is querried.
 * The AI is querried when 'AI TURN <sessionID>' events are emitted
 */
app.post("/longpoll", function(req, res, next) {
    console.log("POST: /longpoll from client with sessionID: " + req.body.sessionID);

    var aiTurnEvent = 'AI TURN ' + req.body.sessionID;  
    
    function onAiTurnEvent(game) { 
        var board = game.board;
        var size = game.board.length;
        var lastMove = game.moveHistory[game.moveHistory.length - 1]; 
        var formattedAIInput = { size: size,
                                board: board,
                                last: {x: lastMove.y, y: lastMove.x, pass: lastMove.pass, c : lastMove.color} }; 

        function aiDidRespond(body) {
            console.log("AI RESPONDS WITH " + body);
            
            var aiMove = JSON.parse(body);
            var boardUpdates = Game.makeMove(aiMove.y, aiMove.x, aiMove.c, game); // NOTE: the AI API uses "x" for rows (confusingly?)

            // update game in database after AI move
            MongoClient.connect(url, function(err, db) {  
                assert.equal(null, err);
                var objectID = new ObjectID(req.body.sessionID);
                db.collection('games').replaceOne({'_id': objectID}, game);
            });
            
            // end response with board updates
            res.json(boardUpdates);
            res.end();
        };
        AIInterface.queryAI(formattedAIInput, aiDidRespond);
    }
    
    // wait for 'AI TURN <sessionID>' event to query AI and respond to longpoll request    
    messageBus.once(aiTurnEvent, onAiTurnEvent);

    // remove the event listener after 30 seconds. NOTE: This period NEEDS to match long-polling timeout on client 
    setTimeout(function() {
        messageBus.removeListener(aiTurnEvent, onAiTurnEvent);
        res.end();
    }, 30000); 

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

            var turn = game.hotseat? game.turn : game.clientColor;

            // make requested move on game then replace game with updates in database
            var boardUpdates = Game.makeMove(req.body.x, req.body.y, turn, game); // TODO: handle errors thown by makeMove

            db.collection('games').replaceOne({'_id' : objectID}, game);

            res.json(boardUpdates);
            if (game.clientColor != game.turn && !game.hotseat) { // not in hotseat mode and it is the AI's turn
                var aiTurnEvent = 'AI TURN ' + req.body.sessionID; // format for AI TURN event string is 'AI TURN <sessionID'
                messageBus.emit(aiTurnEvent, game); // emmit 'AI TURN <sessionID> event to query the AI and respond to long poll request
            }
            res.end();
        });
    });    
});