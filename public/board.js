// enumerations
var COLOR = {
    white: 2,
    black: 1,
    empty: 0
}

class Board {

    constructor(boardSize, canvasSize, canvas, gameID) {

        var rect = canvas.getBoundingClientRect(); //we need to know how offset the canvas is from the viewport
        this.leftOffset = rect.left; // this is the left offset
        this.topOffset = rect.top; //this is the top offset

        this.canvasSize = canvasSize;
        this.boardSize = boardSize; // the number of gridlines
        this.gridMargin = 20;// the margin between the outer gridline and the board
        this.gridWidth = canvasSize-this.gridMargin*2; //the width of the grid
        this.gridHeight = canvasSize-this.gridMargin*2; //the height of the grid

        this.squareSize = this.gridWidth/(this.boardSize-1);


        this.context = canvas.getContext("2d");
        this.lineSize = 2; // the width of the grid lines

        this.gameID = gameID;
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

    //draw a single piece
    drawPiece(x, y, color) {

        //get the x and y coords of the line drawn
        var xcoord = this.gridMargin - this.lineSize/2 + this.gridWidth/(this.boardSize-1)*x;
        var ycoord = this.gridMargin - this.lineSize/2 + this.gridHeight/(this.boardSize-1)*y;

        //draw the circle based on the size of the board squares and color passed
        var radius = this.squareSize*.25;

        this.context.beginPath();
        this.context.arc(xcoord, ycoord, radius, 0, 2 * Math.PI, false);

        if (color == COLOR.black) {
            this.context.fillStyle = "black";
        } else {
            this.context.fillStyle = "white";
        }

        this.context.fill();

    }

    //draw multiple pieces
    drawPieces(pieces){
        for (i = 0; i < pieces.length; i++) {
            drawPiece(pieces[i].x,pieces[i].y,pieces[i].color);
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
