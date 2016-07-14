var gameboard = undefined;

$(document).ready(function() {

    var canvas = document.createElement("CANVAS");
    canvas.id = "canvas";
    canvas.width = $('#boardContainer').width();
    canvas.height = $('#boardContainer').height();
    $(canvas).click(boardClicked);
    $('#boardContainer').append(canvas);
    gameboard = new Board(9,$('#boardContainer').width(),canvas);
    gameboard.drawEmptyBoard();
    $(window).resize(windowResized);

});

function windowResized(event) {

    var canvas = document.getElementById('canvas');
    canvas.width = $('#boardContainer').width();
    canvas.height = $('#boardContainer').height();
    gameboard.calibrate(canvas,$('#boardContainer').width());
    gameboard.drawCurrentBoard();
}

function boardClicked(event) {

    var position = gameboard.getIntersection(event.clientX,event.clientY);
    console.log(position);
    if (position !== undefined) {
        var board = gameboard.board;
        board[position[0]][position[1]] = 0;
        gameboard.updateBoard(board);
    }
}
