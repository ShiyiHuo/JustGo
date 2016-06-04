var gameState = { n: 15, boardEdgeWidth: 20.0, boardTileWidth: 40.0}

// main
window.onload = function() {

   function boardClicked(event) {
       
        var piece = new Image();
        piece.src = "images/blackPiece.png";
        piece.onload = function() { // must wait for the image to load in JavaScript
            
            console.log(event.x);
            console.log(event.y);
            
            var pieceWidth = backgroundImage.width / 20.0;
            var pieceHeight = backgroundImage.height / 20.0;
            var mouseX = event.x - pieceWidth / 2.0;
            var mouseY = event.y - pieceHeight / 2.0;
            var gridX = gameState.boardTileWidth * Math.round((mouseX - gameState.boardEdgeWidth) / gameState.boardTileWidth); 
            var gridY = gameState.boardTileWidth * Math.round((mouseY - gameState.boardEdgeWidth) / gameState.boardTileWidth); 
            
            context.drawImage(piece, gridX, mouseY, pieceWidth, pieceHeight);
        }
   }
   
    // create canvas
    var canvas = document.createElement('canvas');
    canvas.id = "canvas";
    var context = canvas.getContext('2d');
    canvas.width = 1000;
    canvas.height = 1000;
    document.body.appendChild(canvas);

    // create board
    var backgroundImage = new Image();
    backgroundImage.src = "images/background.PNG"
    backgroundImage.onload = function() {
         context.drawImage(backgroundImage, 0, 0);
    };
    canvas.addEventListener("mousedown", boardClicked, false);
   

   
   
   
    var board = {
        
    }
    
    var piece = {
        
    }

}