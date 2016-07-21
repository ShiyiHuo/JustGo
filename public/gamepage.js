var gameboard = undefined;
var timer = undefined;

$(document).ready(function() {

    //post request to get status to determine if user is logged in for menu bar
    $.post("/getStatus", function(data,status) {
        data = JSON.parse(data);
        if (data.login == "yes") {
            console.log("logged in");
            showMenuBar("logged in");
        } else {
            console.log("not logged in");
            showMenuBar();
       }
   });

   //initialize game. if game is ongoing, retrieve game and initialize last board state
   //otherwise begin new game
    $.get("/game", function(data, status) {
        if (data) {
            longpoll();
            initBoard(data.board.length);
            //initTimer(data.whiteTime,data.blackTime,1); implement this
            initTimer(900000,900000,1);
            gameboard.updateBoard(data.board);
            score = {black: data.blackScore, white: data.whiteScore}
            updateScore(score);
        }
    });
});

//the player container contains user scores, usernames, timers, etc
function initPlayerContainer(){
    $('#playerTable').append('<table id="table">');
    $('#playerTable').append('<tr> <th>Pic</th> <th>Players</th> <th>Score</th> <th>Time</th></tr>');
    $('#playerTable').append('<tr> <td>Black</td><td>Player1</td><td id="blackScore"></td><td id="blackTime"></td></tr>');
    $('#playerTable').append('<tr> <td>White</td><td>Player1</td><td id="whiteScore"></td><td id="whiteTime"></td></tr>');
    $('#playerTable').append('</table>');
}


//these are the buttons responsible for passing and resigning
function initButtons(){
    $('#buttonContainer').append('<button type="button" class="button passButton">Pass</button>');
    $('.passButton').click(passClicked);
    $('#buttonContainer').append('<button type="button" class="button resignButton">Resign</button>');
    $('.resignButton').click(resignClicked);

}

//if the user resigns, post to server and write to the player console
function resignClicked(event) {
    $.post("/resign", function(data) {
        writePC("Player resigned<br>");
    });
}

//if the user passes, post to the server and write to the player console
function passClicked(event) {
    var move = {x: 0, y: 0, pass: true};
    $.post("/makeClientMove", move, function(data,status) {
        if (!data.board) {
            window.alert(data);
        } else {
            gameboard.updateBoard(data.board);
            score = {black: data.blackScore, white: data.whiteScore}
            updateScore(score);
            writePC("player passed<br>")
            writePC("whiteTime: " + data.whiteTime + " blackTime: " + data.blackTime + '<br>');
            timer.changeTurn();
        }
    });
}


//initializing the board also initializes the player container which contains stats and the buttons
//as well as the styles of the page.
function initBoard(size) {
    initPlayerContainer();
    initButtons();
    applyStyle();
    var canvas = document.createElement("CANVAS");
    canvas.id = "canvas";
    canvas.width = $('#boardContainer').width();
    canvas.height = $('#boardContainer').height();
    $(canvas).click(boardClicked);
    $('#boardContainer').append(canvas);
    var color = getCookie("boardColor");
    if (color == undefined) {
        color = green;
    }
    gameboard = new Board(size, $('#boardContainer').width(), canvas, color);
    gameboard.drawCurrentBoard();
    $(window).resize(windowResized);
}

function windowResized(event) {

    applyStyle();
    canvas.width = $('#boardContainer').width();
    canvas.height = $('#boardContainer').height();
    gameboard.calibrate(canvas,$('#boardContainer').width());
    gameboard.drawCurrentBoard();
}

function applyStyle() {

    var hwMin = 1/2

    //the width is greater than the height
    if ($('#container').width() >= $('#container').height()) {

        //the width is greater than the height by the ratio
        if (($('#container').width())/($('#container').height()) > (1+hwMin))
        {
            $('#gameContainer').height($('#container').height());
            $('#gameContainer').width($('#container').height()*(1+hwMin));
        }
        //the width is less than the height by the ratio
        else {
            $('#gameContainer').width($('#container').width());
            $('#gameContainer').height($('#container').width()*(1/(1+hwMin)));
        }
        //the board container is the height of the game container
        $('#boardContainer').width($('#gameContainer').height());
        $('#boardContainer').height($('#gameContainer').height());
        $('#dataContainer').width($('#gameContainer').width()-$('#boardContainer').width());
        $('#dataContainer').height($('#boardContainer').height());

    } else {
    //the height is greater than the width
        $('#gameContainer').width($('#container').width());
        $('#gameContainer').height($('#container').width()*(1/(1+hwMin)));
        $('#boardContainer').width($('#gameContainer').height());
        $('#boardContainer').height($('#gameContainer').height());
        $('#dataContainer').width($('#gameContainer').width()-$('#boardContainer').width());
        $('#dataContainer').height($('#boardContainer').height());

    }

    $('#dataContainer').css('left', $('#boardContainer').width());

    //set the player container based on the above bounds
    $('#playerContainer').width($('#dataContainer').width());
    $('#playerContainer').height($('#dataContainer').height()*2/3);

    //set the player table based on the above bounds
    $('#playerTable').width($('#playerContainer').width());
    $('#playerTable').height($('#playerContainer').height()*(2/3));
    $('#playerTable').css('font-size',$('#playerTable').width()*.04);
    $('#playerTable td').css('padding',$('#playerTable').width()*.06);
    $('#playerTable th').css('padding',$('#playerTable').width()*.06);

    //set the button container based on the above bounds
    $('#buttonContainer').css('top', $('#playerContainer').height());
    $('#buttonContainer').height($('#dataContainer').height()-$('#playerContainer').height());
    $('#buttonContainer').width($('#dataContainer').width());


    //set the buttons css
    $('.button').css('margin-top', $('.button').width()*(150/130));
    $('.button').css('margin-left', $('#buttonContainer').width()*.07);
    $('.button').css('width', $('#buttonContainer').width()*.35);
    $('.button').css('padding-top', $('.button').width()*(10/130));
    $('.button').css('padding-bottom', $('.button').width()*(10/130));
    $('.button').css('font-size', $('.button').width()*.25);
    $('.button').css('border', $('.button').width()*(1/130)+" solid Salmon");
    $('.button').css('border-radius', $('.button').width()*(1000/130));

    //create the console window
    $('#playerConsole').width($('#playerContainer').width());
    $('#playerConsole').height($('#playerContainer').height()-$('#playerTable').height());
    $('#playerConsole').css('top',$('#playerTable').height());
    $('#playerConsole').css('font-size',$('#playerConsole').width()*(5/100));

}

function boardClicked(event) {

    var position = gameboard.getIntersection(event.clientX, event.clientY);

    if (position) {
        if (gameboard.board[position.y][position.x] != 0) {
            writePC("You cannot place a piece here<br>");
        } else {
            var move = {x: position.x, y: position.y};
            $.post("/makeClientMove", move, function(data,status) {
                if (!data.board) {
                    writePC(data +'<br>'); // ??????
                } else {
                    gameboard.updateBoard(data.board);
                    score = {black: data.blackScore, white: data.whiteScore}
                    updateScore(score);
                    timer.changeTurn();
                    writePC("whiteTime: " + data.whiteTime + " blackTime: " + data.blackTime + '<br>');
                }
            });
        }
    }
}

function longpoll() {

    $.ajax({
        method: 'GET',
        url: '/longpoll',
        success: function(data) {

            if (data.board) { // AI has made move
                gameboard.updateBoard(data.board);
                score = {black: data.blackScore, white: data.whiteScore}
                updateScore(score);
                timer.changeTurn();
            }
            if (data.winner) { // game has ended
                endgame();
                var winner = data.winner == 1? "Black" : "White";
                writePC("winner is: " + winner + " whiteScore: " + data.whiteScore + " blackScore: " + data.blackScore);
            }

        },
        complete: longpoll,
        timeout: 30000
    });
}


function updateScore(score) {
    $('#blackScore').empty();
    $('#blackScore').append(score.black);
    $('#whiteScore').empty();
    $('#whiteScore').append(score.white);

}

function initTimer(blackTime,whiteTime, turn) {
    timer = new Timer(blackTime,whiteTime,turn);
    var myvar = setInterval(updateTime,1000);
}

function updateTime() {
    timer.clientUpdateTime();
    time = timer.returnTime();
    $('#blackTime').empty();
    $('#blackTime').append(time.blackTime);
    $('#whiteTime').empty();
    $('#whiteTime').append(time.whiteTime);
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length,c.length);
        }
    }
    return "";
}

function writePC(text) {
    $('#playerConsole').prepend(text);
}

//if the game is ended, add a dark transparent overlay to the webpage
//bring up a new page which asks the user if they want a replay
function endgame() {
    $('#container').append('<div id="endgameTrans"></div>');
    $('#container').append('<div id="endgameOpts"></div>');
    $('#endgameOpts').width($('#container').width()*.3);
    $('#endgameOpts').height($('#container').height()*.3);

    //endgame buttons replay and new game
    $('#endgameOpts').append('<button type="button" id="replay">Replay Game History</button>');
    $('#endgameOpts').append('<button type="button" id="newGame">New Game</button>');

    //button functionality
    $('#replay').click(function() {
        writePC("Replay<br>");
    });
    $('#newGame').click(function() {
        writePC("New Game<br>");
    });

    $.get("/moveHistory", function(data, status) {
        if (data) {
            console.log(data);
        }
    });


}

//put the game into replay mode where the user can use arrows to move through the game states
function replay(boardStates) {
    $('#endgameTrans').remove();
    initReplayBoard();
}

//the replay board which cannot be clicked and has no buttons
function initReplayBoard() {
    initPlayerContainer();
    //initButtons();
    applyStyle();
    var canvas = document.createElement("CANVAS");
    canvas.id = "canvas";
    canvas.width = $('#boardContainer').width();
    canvas.height = $('#boardContainer').height();
    //$(canvas).click(boardClicked);
    $('#boardContainer').append(canvas);
    var color = getCookie("boardColor");
    if (color == undefined) {
        color = green;
    }
    gameboard = new Board(size, $('#boardContainer').width(), canvas, color);
    gameboard.drawCurrentBoard();
    $(window).resize(windowResized);

}


//show menu bar
function showMenuBar(login) {

    if (login == "logged in") {
        $('body').append('<ul><li><a id="logoutB">Log Out</a></li><li><a id="userCenter">User Center</a></li><li><a id="aboutUs">About Us</a></li></ul>');

        $('#logoutB').on('click', function() {
            $.post("/logout", function(data, status) {
                data = JSON.parse(data);
                if (data.status == "OK") {
                    console.log("Logged out");
                    window.location = data.redirect;
                }
            });
        });


        //use stack to go to previous page
        $('#userCenter').on('click', function() {
            $('body').children().remove();
            showUserCenter();
        });

        $('#aboutUs').on('click', function() {
            $('body').children().remove();
            showAboutUs();
        });

    }

    else {
        $('body').append('<ul>' + '<li><a id="aboutUs">About Us</a></li>' + '</ul>');
        $('#aboutUs').on('click', function() {
            $('body').children().remove();
            showAboutUs();
        });
    }

}
