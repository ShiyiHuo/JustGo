var gameboard = undefined;

$(document).ready(function() {
    $.get("/game", function(data, status) {
        if (data) {
            longpoll();
            initBoard(data.board.length);
            gameboard.updateBoard(data.board);
        } else {
            var size = 19;
            var hotseat = true;
            $.post("/newGame", { size : size, hotseat : hotseat }, function(data, status) {
                initBoard(size);
                longpoll();
            });
        }         
    });
});

function resign() {
    $.get("/resign", function(data) {
        window.alert(data);
    });
}

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

    if (gameboard.board[position.y][position.x] != 0) {
        console.log("You cannot place a piece here");
    } else {
        var move = {x: position.x, y: position.y};
        $.post("/makeClientMove", move, function(data,status) {
            if (!data.board) {
                window.alert(data); // ??????
            } else {
                gameboard.updateBoard(data.board);
                $('#dataContainer').append("whiteTime: " + data.whiteTime + " blackTime: " + data.blackTime + "\n");
            }   
        });
    }
}

function longpoll() {

    $.ajax({
        method: 'GET',
        url: '/longpoll',
        success: function(data) {
            
            if (data.board) { // AI has made move
                gameboard.updateBoard(data.board);
            } 
            if (data.winner) { // game has ended
                var winner = data.winner == 1? "Black" : "White"; 
                window.alert("winner is: " + winner + " whiteScore: " + data.whiteScore + " blackScore: " + data.blackScore);
            }
            
        },
        complete: longpoll,
        timeout: 30000
    });
}
