var gameboard = undefined;

$(document).ready(function() {

    $.post("/newGame", "Client wants new game", function(data, status) {

            //create the canvas append it and pass it to the board object
            var canvas = document.createElement("CANVAS");
            canvas.id = "canvas";
            canvas.width = $('#boardContainer').width();
            canvas.height = $('#boardContainer').height();
            $(canvas).click(boardClicked);             //give the canvas a click event
            $('#boardContainer').append(canvas);

            //create the pass and resign buttons and append them to the board

            $('#boardContainer').append('<button type="button" class="button" id="passB">PASS</button><br>');
            $('#boardContainer').append('<button type="button" class="button" id="resignB">RESIGN</button><br>');
            $('#passB').click(passBClicked);
            $('#resignB').click(resignBClicked);


            gameboard = new Board(9,$('#boardContainer').width(),canvas);
            gameboard.drawCurrentBoard();
            $(window).resize(windowResized);
            longpoll();
    });

});

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

function passBClicked(event){
    console.log("Pass button clicked");
}

function resignBClicked(event) {
    console.log("Resigned button clicked");
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
