class Board {

    constructor(boardSize, squareSize, canvas, gameID) {
        
        //create the board based on boardSize
        this.squareSize = squareSize; // pixel width of board squares
        this.boardSize = boardSize; // number of gridlines
        this.context = canvas.getContext("2d");
        this.width = this.squareSize * (boardSize - 1);
        this.height = this.squareSize * (boardSize - 1);
        this.lineSize = 3;
        this.gameID = gameID;
        this.boardState;

        //change the canvas attributes
        canvas.height = this.height + this.lineSize;
        canvas.width = this.width + this.lineSize;

        //get the canvas position
        var rect = canvas.getBoundingClientRect();
        this.leftOffset = rect.left;
        this.topOffset = rect.top;
        console.log(rect.top, rect.right, rect.bottom, rect.left);
    }

    drawBoard() {
        this.context.fillStyle = "#F5DEB3";
        this.context.fillRect(this.lineSize,this.lineSize,this.width,this.height);
        
        //draw vertical lines
        this.context.fillStyle = "#000000";
        for (var i = 0; i < this.boardSize; i++){
            var xcoord = this.squareSize*i;
            var ycoord = 0;
            this.context.fillRect(xcoord, ycoord, this.lineSize, this.height);
        }
        
        //draw horizontal lines
        for (var i = 0; i < this.boardSize; i++){
            var ycoord = this.squareSize * i;
            var xcoord = 0;
            this.context.fillRect(xcoord, ycoord, this.width, this.lineSize);
        }
    }

    getGameID() {
        return this.gameID;
    }

    /**
     * Draw a piece on intersection (x, y) of the board canvas.
     * Takes parameters x, y in PIXELS!
     */
    placePiece(x, y, color) {

        console.log(color);
        x = x * this.squareSize - 20;
        y = y * this.squareSize - 20;

        var context = this.context;
        var piece = new Image();
        piece.src = 'img/blackPiece.png'
        piece.onload = function() {
            context.drawImage(piece, x, y, 40, 40)
        }   
    }

    getIntersection(xcoord, ycoord) {
        //represent boardgame lines
        var xpos = -1;
        var ypos = -1;

        //adjust for offset
        xcoord = xcoord - this.leftOffset - this.lineSize;
        ycoord = ycoord - this.topOffset - this.lineSize;

        //determine whether click is acceptable as board position
        for (var i = 0; i < this.boardSize + 1; i++) {
            var absDist = Math.abs(xcoord - this.squareSize * i);
            if (absDist < 10) {
                xpos = i;
                break;
            }
        }

        for (var i = 0; i < this.boardSize + 1; i++) {
            absDist = Math.abs(ycoord - this.squareSize * i); 
            if (absDist < 10) {
                ypos = i;
                break;
            }
        }

        if (xpos != -1 && ypos != -1) {
            return [xpos, ypos];
        } else {
            return;
        }

    }
}
