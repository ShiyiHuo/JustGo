var gameboard = undefined;

$(document).ready(function() {

    var canvas = document.createElement("CANVAS");
    canvas.width = $('#boardContainer').width();
    canvas.height = $('#boardContainer').height();
    $(canvas).click(boardClicked);
    $('#boardContainer').append(canvas);
    gameboard = new Board(9,$('#boardContainer').width(),canvas);
    gameboard.drawEmptyBoard();

});

function boardClicked(event) {

    var pos = gameboard.getIntersection(event.clientX,event.clientY);
    var move = {"x": position[0], "y": position[1], gameID: gameBoard.gameID};


    $.post("/makeClientMove", move, function(data, status) {
        data = JSON.parse(data);
        if (data == "Illegal Move") { // TODO: fix this to actually handle more errors
            window.alert("Illegal Move. Try again");
        }
        gameBoard.placePiece(data.x, data.y, data.color);

        if (data.capturedPieces) {
            gameBoard.removePieces(data.capturedPieces);
        }
    });



    if (pos != undefined) {
        gameboard.drawPiece(pos[0],pos[1],"white");
    }


}
