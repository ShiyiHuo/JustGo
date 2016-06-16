class Board {
    constructor(boardSize, squareSize, canvas, gameID) {
        
        //create the board based on boardSize
        this.squareSize = squareSize;
        this.boardSize = boardSize;
        this.context = canvas.getContext("2d");
        this.width = this.squareSize*(boardSize-1);
        this.height = this.squareSize*(boardSize-1);
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
            this.context.fillRect(xcoord,ycoord,this.lineSize,this.height);
        }
        
        //draw horizontal lines
        for (var i = 0; i < this.boardSize; i++){
            var ycoord = this.squareSize*i;
            var xcoord = 0;
            this.context.fillRect(xcoord,ycoord,this.width,this.lineSize);
        }
    }

    reDrawTiles() {

    }


    getGameID() {
        return this.gameID;
    }

    getIntersection(xcoord, ycoord) {
        //represent boardgame lines
        var xpos = -1;
        var ypos = -1;

        //adjust for offset
        xcoord = xcoord-this.leftOffset-this.lineSize;
        ycoord = ycoord-this.topOffset-this.lineSize;

        //determine whether click is acceptable as board position
        for (var i = 0; i < this.boardSize + 1; i++) {
            var absDist = Math.sqrt((xcoord - this.squareSize * i) * (xcoord - this.squareSize * i));
            if (absDist < 10) {
                xpos = i;
                break;
            }
        }

        for (var i = 0; i < this.boardSize + 1; i++) {
            absDist = Math.sqrt((ycoord - this.squareSize * i) * (ycoord - this.squareSize * i));
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
