window.onload = function() {

    //create new game button and append it
    newGameButton = document.createElement('button');
    newGameButton.setAttribute("id","newGameButton");
    $("body").append(newGameButton);
    $("#newGameButton").html("New Game");

    //clicking new game calls new game function
    $("#newGameButton").click(function() {
        $("#newGameButton").hide();
        $.post("/newGame","Client wants new game",function(gameID,status) {
            if (status === "success" && gameID != undefined) {
                    console.log("Starting new game.");
                    newGame(gameID);
            }
        });
    });
}


function newGame(gameID) {
    canvas = document.createElement('canvas');
    $("body").append(canvas);

    gameboard = new Board(9,50,canvas,gameID);
    console.log("New board created with id: ", gameboard.getGameID());

    $("canvas").click(function(e) {
        var pos = gameboard.getIntersection(e.clientX,e.clientY);
        console.log("The position is ", pos);

        $.post("/move",JSON.stringify(pos),function(d,s) {
            console.log("The status is", s);
            console.log("The data is ", d);
        });
    });
    gameboard.drawBoard();
}
