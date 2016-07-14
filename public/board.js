// enumerations
var COLOR = {
    white: 2,
    black: 1,
    empty: 0
}

class Board {

    constructor(boardSize, canvasSize, canvas, gameID) {

        this.boardSize = boardSize;

        //variables we'll need to draw the board
        this.leftOffset; // this is the left offset
        this.topOffset; //this is the top offset
        this.canvasSize; //size of the canvas
        this.gridMargin;// the margin between the outer gridline and the board
        this.gridWidth; //the width of the grid
        this.gridHeight; //the height of the grid
        this.squareSize; //the size of the grid square

        //lumped calibration into one function since we recall it when resizing
        this.calibrate(canvas, canvasSize);

        this.board = new Array(this.boardSize); //declaring a current board
        for (var i = 0; i < this.board.length; i++) {
            this.board[i] = new Array(this.boardSize);
            for (var j = 0; j < this.board[i].length; j++) {
                this.board[i][j] = 0;
            }
        }

        this.context = canvas.getContext("2d");
        this.lineSize = 2; // the width of the grid lines

        this.gameID = gameID;
    }

    calibrate(canvas, canvasSize) {

        var rect = canvas.getBoundingClientRect(); //we need to know how offset the canvas is from the viewport
        this.leftOffset = rect.left; // this is the left offset
        this.topOffset = rect.top; //this is the top offset

        this.canvasSize = canvasSize; // the size of the canvas
        this.gridMargin = 20;// the margin between the outer gridline and the board
        this.gridWidth = canvasSize-this.gridMargin*2; //the width of the grid
        this.gridHeight = canvasSize-this.gridMargin*2; //the height of the grid

        this.squareSize = this.gridWidth/(this.boardSize-1);

    }

    drawEmptyBoard() {
        //draw the board background
        this.context.fillStyle = "#F5DEB3";
        this.context.fillRect(0,0,this.canvasSize,this.canvasSize);

        //draw vertical lines
        this.context.fillStyle = "#000000";
        for (var i = 0; i < this.boardSize; i++){
            var xcoord = this.gridMargin - this.lineSize/2 + this.gridWidth/(this.boardSize-1)*i;
            var ycoord = this.gridMargin;
            this.context.fillRect(xcoord, ycoord, this.lineSize, this.gridHeight);
        }

        //draw horizontal lines
        for (var i = 0; i < this.boardSize; i++){
            var xcoord = this.gridMargin;
            var ycoord = this.gridMargin - this.lineSize/2 + this.gridHeight/(this.boardSize-1)*i;
            this.context.fillRect(xcoord, ycoord, this.gridWidth, this.lineSize);
        }
    }

    //replace board with new board
    updateBoard(board) {
        this.board = board;
        this.drawCurrentBoard();
    }

    //draw a single piece
    drawPiece(x, y, color) {

        //get the x and y coords of the line drawn
        var xcoord = this.gridMargin - this.lineSize/2 + this.gridWidth/(this.boardSize-1)*x;
        var ycoord = this.gridMargin - this.lineSize/2 + this.gridHeight/(this.boardSize-1)*y;

        //draw the circle based on the size of the board squares and color passed
        var radius = this.squareSize*.25;

        this.context.beginPath();
        this.context.arc(xcoord, ycoord, radius, 0, 2 * Math.PI, false);

        //draw either black or white
        if (color == COLOR.black) {
            this.context.fillStyle = "black";
        } else if (color == COLOR.white) {
            this.context.fillStyle = "white";
        }

        this.context.fill();

    }

    drawCurrentBoard() {
        this.drawEmptyBoard();
        for (var i = 0; i < this.board.length; i++){
            for (var j = 0; j < this.board[i].length; j++) {
                if (this.board[i][j] != 0) {
                    this.drawPiece(i,j,this.board[i][j]);
                }
            }
        }
    }

    getIntersection(xcoord, ycoord) {
        // use the offset and the math of the board drawn to get the intersection
        var xpos = -1;
        var ypos = -1;

        //adjust for offset and grid margin
        xcoord = xcoord - this.leftOffset - this.gridMargin;
        ycoord = ycoord - this.topOffset - this.gridMargin;

        //find closest x gridline and y gridline
        var closestXGL = Math.round(xcoord/this.squareSize);
        var closestYGL = Math.round(ycoord/this.squareSize);


        //if grid line is close enough to intersection, 25% of square size, post position
        if (Math.abs(closestXGL*this.squareSize-xcoord) < this.squareSize*.25) {
            xpos = closestXGL;
        }
        if (Math.abs(closestYGL*this.squareSize-ycoord) < this.squareSize*.25) {
            ypos = closestYGL;
        }
        if (xpos != -1 && ypos != -1) {
            return [xpos, ypos];
        } else {
            return;
        }

    }



}
