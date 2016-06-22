var express = require("express");
var bodyParser = require("body-parser");
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var go = require('./game/go.js')
var AIInterface = require('./ai/AIInterface.js');

var app = express();
var messageBus = new EventEmitter();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// mongodb configuration
var ObjectID = require('mongodb').ObjectID;
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/GoData';

/**
 * Set up server
 */
app.listen(30144, function() {

    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log("ERROR connecting to mongodb: " + err);
        }
	    console.log("Connected correctly to mongodb server");
	    db.close();
    });

    console.log("Express listening on port 30144");
}); 

/**
 * Create a new game state and store it in database
 * 
 * @param req should be in form { size : int, hotseat : boolean }
 */
app.post("/newGame", function(req, res, next) {

    // TODO: allow for customizable sizes
    // TODO: option to construct game with game.hotseatMode = true  

    var size = 9;
    var newGame = new go.Game(size);

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
 * The request is responded to with move data when the AI is querried on 'AI TURN <sessionID>' events 
 * 
 * @param req should be in form { sessionID : string } 
 * 
 * response (if not empty) is a Move object
 */
app.post("/longpoll", function(req, res, next) {

    // wait for 'AI TURN <sessionID>' event to query AI and respond to longpoll request
    var aiTurnEvent = 'AI TURN ' + req.body.sessionID; 
    messageBus.once(aiTurnEvent, onAiTurnEvent);

    // remove the event listener after 30 seconds. NOTE: This period NEEDS to match long-polling timeout period on client 
    setTimeout(function() {
        messageBus.removeListener(aiTurnEvent, onAiTurnEvent);
        res.end();
    }, 30000); 

    function onAiTurnEvent(game) { 
        var board = game.board;
        var size = game.board.length;
        var lastMove = game.moveHistory[game.moveHistory.length - 1]; 
        var formattedAIInput = { size: size,
                                board: board,
                                last: {x: lastMove.y, y: lastMove.x, pass: lastMove.pass, c : lastMove.color} }; 

        AIInterface.query(formattedAIInput, onAiResponse);

        function onAiResponse(body) {    
            var aiMove = JSON.parse(body);
            var boardUpdates = go.makeMove(game, aiMove.y, aiMove.x, aiMove.c, aiMove.pass); // NOTE: the AI API uses "x" for rows (confusingly?)

            // TODO: handle errors thown by go.makeMove 
            // TODO: check AI legal move and requry if not legal

            // update game in database after AI move
            MongoClient.connect(url, function(err, db) {  
                assert.equal(null, err);
                var objectID = new ObjectID(req.body.sessionID);
                db.collection('games').replaceOne({'_id': objectID}, game);
            });
            
            // end response with board updates
            res.json(boardUpdates);
            res.end();
        }   
    }

});

/**
 * Sent when the client clicks the board.
 * @param req should be in form { x: int, y: int, sessionID: int, pass: boolean }
 * 
 * Response is a Move object
 */
app.post("/makeClientMove", function(req, res, next) {
    
    MongoClient.connect(url, function(err, db) {
        assert.equal(null , err);

        // lookup game in database
        var objectID = new ObjectID(req.body.sessionID);
        db.collection('games').findOne({'_id' : objectID}, function(error, game) {

            var turn = game.hotseatMode? game.turn : game.clientColor;

            // TODO: handle errors thown by go.makeMove

            // make requested move on game then replace game with updates in database
            var boardUpdates = go.makeMove(game, req.body.x, req.body.y, turn, false); 

            db.collection('games').replaceOne({'_id' : objectID}, game);

            res.json(boardUpdates);
            if (game.clientColor != game.turn && !game.hotseatMode) { // not in hotseat mode and it is the AI's turn
                var aiTurnEvent = 'AI TURN ' + req.body.sessionID; // format for AI TURN event string is 'AI TURN <sessionID'
                messageBus.emit(aiTurnEvent, game); // emmit 'AI TURN <sessionID> event to query the AI and respond to long poll request
            }
            res.end();
        });
    });    
});