// globals 
gameBoard = undefined;

/**
 * Create New Game button and append
 */
window.onload = function() {
    newGameButton = document.createElement('button');
    newGameButton.setAttribute("id", "newGameButton");
    $("body").append(newGameButton);
    $("#newGameButton").html("New Game");
    $("#newGameButton").click(newGame);
}

/**
 * Create gameBoard and start long poll
 */
function newGame() {
    $("#newGameButton").hide();
    $.post("/newGame", "Client wants new game", function(gameID, status) { 
        
        if (gameID) { // if there server returns a session/game ID create and display board
            canvas = document.createElement('canvas');
            $("body").append(canvas);
            gameBoard = new Board(9, 50, canvas, gameID);
            $("canvas").click(boardClicked);
            gameBoard.drawBoard();

            longpoll();
        }
    });
}

/**
 * Called when gameBoard is clicked. Sends move to server then tells gameBoard to place piece
 */
function boardClicked(event) {
        var position = gameBoard.getIntersection(event.clientX, event.clientY);
        var move = {"x": position[0], "y": position[1], "sessionID": gameBoard.gameID};
        
        $.post("/makeClientMove", move, function(data) {    
            if (data == "Illegal Move") { // TODO: fix this to actually handle more errors
                window.alert("Illegal Move. Try again");
            }
            gameBoard.placePiece(data.x, data.y, data.color);

            if (data.capturedPieces) {
                gameBoard.removePieces(data.capturedPieces);
            }
        });
}

function longpoll() {
    var sessionID = {"sessionID": gameBoard.gameID};
    
    $.ajax({
        method: 'POST',
        url: '/longpoll',
        data: sessionID,
        success: function(data) {
            gameBoard.placePiece(data.x, data.y, data.color);

            if (data.capturedPieces) {
                gameBoard.removePieces(data.capturedPieces);
            }
        }, 
        complete: longpoll,
        timeout: 30000 
    });
} 

