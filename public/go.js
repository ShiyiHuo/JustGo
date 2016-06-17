// globals 
gameBoard = undefined;

window.onload = function() {

    // create new game button and append it
    newGameButton = document.createElement('button');
    newGameButton.setAttribute("id","newGameButton");
    $("body").append(newGameButton);
    $("#newGameButton").html("New Game");

    // clicking new game calls new game function
    $("#newGameButton").click(function() {
        $("#newGameButton").hide();
        $.post("/newGame", "Client wants new game", function(gameID, status) {
            if (status === "success" && gameID != undefined) {
                    console.log("Starting new game.");
                    newGame(gameID);
            }
        });
    });
}

/**
 * Create gameBoard
 */
function newGame(gameID) {
    canvas = document.createElement('canvas');
    $("body").append(canvas);

    gameBoard = new Board(9, 50, canvas, gameID);

    $("canvas").click(boardClicked);
    gameBoard.drawBoard();
}

/**
 * Called when gameBoard is clicked. Sends move to server then tells gameBoard to place piece
 */
function boardClicked(event) {
        var position = gameBoard.getIntersection(event.clientX, event.clientY);
        var move = {"x": position[0], "y": position[1]};
        
        $.post("/makeClientMove", move, function(data) {
            
            console.log(data);

            if (data == "Illegal Move") {
                window.alert("Illegal Move. Try again");
            }
            
            var x = data[0];
            var y = data[1];
            var color = data[2];
            gameBoard.placePiece(x, y, color);
        });
}
