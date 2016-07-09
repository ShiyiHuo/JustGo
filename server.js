var express = require("express");
var bodyParser = require("body-parser");
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var go = require('./game/go.js');
var constants = require('./game/constants.js');
var AIInterface = require('./ai/AIInterface.js');
var MongoInterface = require('./MongoInterface');


var app = express();
var messageBus = new EventEmitter();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


/**
 * Set up server
 */
app.listen(30144, function() {
    console.log("Express listening on port 30144");
}); 

/**
 * Create a new game state and store it in database
 * 
 * @param req should be in form { size : int, hotseat : boolean }
 * 
 * @return response is a gameID 
 */
app.post("/newGame", function(req, res, next) {

    // TODO: allow for customizable sizes
    // TODO: option to construct game with game.hotseatMode = true  

    var size = 9;
    var newGame = new go.Game(size);

    // TODO: also check if it is hotseat play and not clients turn. 
    // In that case emit an 'AI TURN' event here aswell
    
    // create new game in database, respond with game id
    MongoInterface.newGame(size, false, function(gameID) {
        res.json(gameID); // NOTE: won't need to send game id in the future, will just pair a gameID with the user's session
        res.end();
    });

});

/**
 * Periodic polling request from the client every 30 seconds.
 * The request is responded to with move data when the AI is querried 
 * The AI is querried when events with string "AI TURN <gameID>" are emitted
 * 
 * @param req should be in form { gameID : string } 
 * 
 * @return response (if not empty) is a Move object
 */
app.post("/longpoll", function(req, res, next) {

    // wait for 'AI TURN <gameID>' event to query AI and respond to longpoll request
    var aiTurnEvent = 'AI TURN ' + req.body.gameID; 
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
            MongoInterface.makeMoveOnGameWithID(
                req.body.gameID,
                aiMove.y,
                aiMove.x,
                aiMove.c,
                aiMove.pass,
                function() {
                    // end response with board updates
                    res.json(boardUpdates);
                    res.end();
                }
            );

        }   
    }

});

/**
 * Sent when the client clicks the board.
 * @param req should be in form { x: int, y: int, gameID: int, pass: boolean, resign: boolean }
 * 
 * @return response is a Move object
 */
app.post("/makeClientMove", function(req, res, next) {
    
    // find game in database and make move then respond with Move object
    MongoInterface.makeMoveOnGameWithID(
        req.body.gameID, // NOTE: in the future, gameID will be looked up based on the user's session (will pair user sessions with active games) 
        req.body.x, 
        req.body.y, 
        constants.clientColor, 
        false, 
        function(game, boardUpdates) {
            res.json(boardUpdates);
            res.end();
            
            // see if we need to query AI
            if (game.clientColor != game.turn && !game.hotseatMode) { // not in hotseat mode and it is the AI's turn
                var aiTurnEvent = 'AI TURN ' + req.body.gameID; // format for AI TURN event string is 'AI TURN <gameID'
                messageBus.emit(aiTurnEvent, game); // emmit 'AI TURN <gameID> event to query the AI and respond to long poll request
            }
        }
    );

});