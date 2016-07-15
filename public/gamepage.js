var gameboard = undefined;

$(document).ready(function() {
    $.get("/game", function(data, status) {
        if (data) {
            initBoard(data.board.length);
            gameboard.updateBoard(data.board);
        } else {
            $.post("/newGame", "Client wants new game", function(data, status) {
                initBoard(9);
            });
        }            
    });
});


function initBoard(size) {
    var canvas = document.createElement("CANVAS");
    canvas.id = "canvas";
    canvas.width = $('#boardContainer').width();
    canvas.height = $('#boardContainer').height();
    $(canvas).click(boardClicked);
    $('#boardContainer').append(canvas);
    gameboard = new Board(size, $('#boardContainer').width(),canvas);
    gameboard.drawCurrentBoard();
    $(window).resize(windowResized);
    longpoll();
}

function windowResized(event) {

    var canvas = document.getElementById('canvas');
    canvas.width = $('#boardContainer').width();
    canvas.height = $('#boardContainer').height();
    gameboard.calibrate(canvas,$('#boardContainer').width());
    gameboard.drawCurrentBoard();
}

function boardClicked(event) {

    var position = gameboard.getIntersection(event.clientX, event.clientY);

    if (gameboard.board[position[0]][position[1]] != 0) {
        console.log("You cannot place a piece here");
    } else {
        var move = {"x": position[1], "y": position[0], gameID: gameboard.gameID};
        $.post("/makeClientMove", move, function(data,status) {
            gameboard.updateBoard(data.board);
        });
    }
}

function longpoll() {
    var gameID = {gameID: gameboard.gameID};

    $.ajax({
        method: 'POST',
        url: '/longpoll',
        data: gameID,
        success: function(data) {
            gameboard.updateBoard(data.board);
        },
        complete: longpoll,
        timeout: 30000
    });
}
