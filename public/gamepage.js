var gameboard;
var loggedIn = true;
var gameHasEnded;
var replayData;
var replayPos = 0;
var username = "player1";

$(document).ready(function() {
    initPage();
});

function initPage() {
    showNavBar();
    getStatus();
    gameEventHandler('getGame');
    $(window).trigger('resize');
}

//handles all game related events
function gameEventHandler(eventType, data) {

    if (eventType == 'getGame') {
        console.log("Getting existing game");
        $.get("/game", function(data, status) {
            if (data) {
                longpoll();
                gameEventHandler('initBoard', data);
                initTimer(900000,900000,1);
                console.log("Timers set for 15 minutes.")
                gameEventHandler('boardUpdate', data);
                gameEventHandler('scoreChange',data);
                if (data.winner) {
                    gameEventHandler('endGame',data);
                }
            }
            else {
                console.log("Couldnt get existing game");
            }
        });
    }

    else if (eventType == 'aiMove') {
        console.log("AI made move");
        if (data.pass === 'true') {
            writePC('AI passed');
        }
        if (data.color == 2) {
            writePC('Blacks move');
        } else {
            writePC('Whites move');
        }
        gameEventHandler('boardUpdate', data);
        gameEventHandler('scoreChange', data);
        gameEventHandler('turnChange');
    }

    else if (eventType == 'scoreChange') {
        console.log("Change in score");
        $('#blackScore').empty();
        $('#blackScore').append(data.blackScore);
        $('#whiteScore').empty();
        $('#whiteScore').append(data.whiteScore);
    }
    else if (eventType == 'turnChange') {
        console.log('change in turn');
        timer.changeTurn();
    }
    else if (eventType == 'boardUpdate') {
        console.log('board update');
        gameboard.updateBoard(data.board);
    }
    else if (eventType == 'stopTimer') {
        timer.stopTimer();
    }
    else if (eventType == 'newGame') {

        gameHasEnded = false;
        console.log("Starting new game");
        var boardSizeSelected = gameboard.boardSize;
        var hotseatSelected = false;
        var newGameParameters = {size: boardSizeSelected, hotseat: hotseatSelected};
        $.post("/newGame", newGameParameters, function(data, status) {
            window.location = '/gamepage.html';
        });
    }

    else if (eventType == 'endGame') {
        gameHasEnded = true;
        console.log('Game has ended');
        gameEventHandler('stopTimer');
        var winner = data.winner == 1? "Black" : "White";
        writePC("winner is: " + winner + " whiteScore: " + data.whiteScore + " blackScore: " + data.blackScore);
        showEndGameOpts();
    }

    else if (eventType == 'replay') {
        console.log("initializing replay with data \n");
        $.get("/game/moveHistory", function(data, status) {
            if (data) {
                replayData = data;
                removeGameBoard();
                removeGameButtons();
                removeEndGameOpts();
                initReplayBoard(gameboard.boardSize);
            }
        });
    }
    else if (eventType == 'forwardClicked') {
        console.log('forward clicked');
        if (typeof replayData !== 'undefined') {
            if (replayPos < replayData.length-1) {
                replayPos = replayPos+1;
                gameEventHandler('boardUpdate',replayData[replayPos]);
            }
            else {
                console.log("Cannot move forward");
                writePC("Cannot move forward <br>");
            }
        }
        else {
            console.log("Replay unavailable");
            writePC("Replay unavailable <br>");
        }
    }

    else if (eventType == 'animateRemovedPieces') {
        //gambeboard.animate(data);
    }

    else if (eventType == 'backwardClicked') {

        console.log('backward clicked');
        if (typeof replayData !== 'undefined') {
            if (replayPos > 0) {
                replayPos = replayPos-1;
                gameEventHandler('boardUpdate',replayData[replayPos]);
            }
            else {
                console.log("Cannot move backward");
                writePC("Cannot move backward <br>");
            }
        }
        else {
            console.log("Replay unavailable");
            writePC("Replay unavailable <br>");
        }

    }
    else if (eventType == 'mouseMoved') {
            var position = gameboard.getIntersection(event.clientX,event.clientY);
            if (position) {
                if (gameboard.board[position.y][position.x] == 0) {
                    gameboard.drawTempPiece(position.x,position.y,1);
                }
            }
    }
    else if (eventType == 'mouseLeft') {
        gameboard.drawCurrentBoard();
    }

    else if (eventType == 'initBoard') {
        console.log('initializing board');
        initBoard(data.board.length);
    }
    else if (eventType == 'resignClicked') {
        console.log('Player resigned');
        $.post("/game/resign", function(data) {
            writePC("Player resigned<br>");
        });
    }
    else if (eventType == 'passClicked') {

        writePC('Client passed');
        var move = {x: 0, y: 0, pass: true};
        gameEventHandler('clientMove', move);

    }
    else if (eventType == 'boardClicked'){
        var position = gameboard.getIntersection(event.clientX, event.clientY);
        if (position) {
            if (gameboard.board[position.y][position.x] != 0) {
                writePC("You cannot place a piece here<br>");
            } else {
                var move = {x: position.x, y: position.y};
                gameEventHandler('clientMove', move);
            }
        }
    }

    else if (eventType == 'clientMove') {
        $.post("/game/makeClientMove", data, function(data,status) {
            if (!data.board) {
                writePC(data);
            } else {
                gameEventHandler('boardUpdate', data);
                gameEventHandler('scoreChange', data);
                gameEventHandler('turnChange');
                if (data.color == 2) {
                    writePC('Blacks move');
                } else {
                    writePC('Whites move');
                }
            }
        });
    }

    else if (eventType == 'updateTime') {
        timer.clientUpdateTime();
        time = timer.returnTime();
        $('#blackTime').empty();
        $('#blackTime').append(time.blackTime);
        $('#whiteTime').empty();
        $('#whiteTime').append(time.whiteTime);
    }

    else if (eventType == 'stopReplay') {
        removeReplayButtons();
        showEndGameOpts();
    }

    else {
        window.alert("CASE NOT HANDLED"+ eventType);
    }

}

function windowResized(event) {

    applyStyle();
    canvas.width = $('#boardContainer').width();
    canvas.height = $('#boardContainer').height();
    gameboard.calibrate(canvas,$('#boardContainer').width());
    gameboard.drawCurrentBoard();
}

var gameActive = true;
function longpoll() {
    $.ajax({
        method: 'GET',
        url: '/game/longpoll',
        success: function(data) {
            if (data.board) { // AI has made move
                gameEventHandler('aiMove', data);
            }
            if (data.winner) { // game has ended
                gameActive = false;
                gameEventHandler('endGame', data);
            }
        },
        complete: function() {
            if (gameActive) {
                longpoll();
            }
        },
        timeout: 30000
    });
}

function showEndGameOpts() {
    $('#container').append('<div id="endgameTrans"></div>');
    $('#container').append('<div id="endgameOpts"></div>');
    $('#endgameOpts').width($('#container').width()*.3);
    $('#endgameOpts').height($('#container').height()*.15);

    //endgame buttons replay and new game
    $('#endgameOpts').append('<button type="button" class="endgameButton" id="replay">Replay Game History</button><br>');
    $('#endgameOpts').append('<button type="button" class="endgameButton" id="newGame">New Game</button>');

    //button styling
    $('.endgameButton').width($('#endgameOpts').width()*.9);
    $('.endgameButton').height($('#endgameOpts').height()*.25);
    $('.endgameButton').css('margin-left','0 auto');
    $('.endgameButton').css('margin-right','0 auto');
    $('.endgameButton').css('margin-top', $('#endgameOpts').height()*.1);

    //button functionality
    $('#replay').click(function() {
        gameEventHandler('replay');
    });
    $('#newGame').click(function() {
        gameEventHandler('newGame');
    });
}

function removeEndGameOpts() {
    $('#endgameTrans').remove();
    $('#endgameOpts').remove();
}

function removeReplayButtons() {
    $('#buttonContainer').empty();
    $('#stopReplayContainer').remove();
}

function removeGameBoard() {
    $('#boardContainer').empty();
}

function removeGameButtons() {
    $('#buttonContainer').empty();
}

function initReplayBoard(size) {
    initReplayButtons();
    applyStyle();
    var canvas = document.createElement("CANVAS");
    canvas.id = "canvas";
    canvas.width = $('#boardContainer').width();
    canvas.height = $('#boardContainer').height();
    $('#boardContainer').append(canvas);
    var color = getCookie("boardColor");
    if (color == undefined) {
        color = white;
    }
    gameboard = new Board(size, $('#boardContainer').width(), canvas, color);
    gameboard.drawCurrentBoard();

}

function initBoard(size) {
    initPlayerContainer();
    initButtons();
    applyStyle();
    var canvas = document.createElement("CANVAS");
    canvas.id = "canvas";
    canvas.width = $('#boardContainer').width();
    canvas.height = $('#boardContainer').height();
    $(canvas).mousemove(boardMove);
    $(canvas).mouseleave(boardLeft);
    $(canvas).click(boardClicked);
    $('#boardContainer').append(canvas);
    var color = getCookie("boardColor");
    if (color == undefined) {
        color = white;
    }
    gameboard = new Board(size, $('#boardContainer').width(), canvas, color);
    gameboard.drawCurrentBoard();
    $(window).resize(windowResized);
}

function boardMove(event) {
    gameEventHandler('mouseMoved', event);
}

function boardLeft(event) {
    gameEventHandler('mouseLeft', event);
}

function boardClicked(event) {
    gameEventHandler('boardClicked', event);
}


//the player container contains user scores, usernames, timers, etc
function initPlayerContainer(){

    $('#playerTable').append('<table id="table" frame="box" rules="none" border="0">');
    $('#playerTable').append('<tr> <th>Color</th> <th>Players</th> <th>Score</th> <th>Time</th></tr>');
    $('#playerTable').append('<tr> <td>Black</td><td>'+ username +'</td><td id="blackScore"></td><td id="blackTime"></td></tr>');
    $('#playerTable').append('<tr> <td>White</td><td>Player2</td><td id="whiteScore"></td><td id="whiteTime"></td></tr>');
    $('#playerTable').append('</table>');
}

//these are the buttons responsible for passing and resigning
function initButtons(){
    $('#buttonContainer').append('<button type="button" class="button passButton">Pass</button><br>');
    $('.passButton').click(passClicked);
    $('#buttonContainer').append('<button type="button" class="button resignButton">Resign</button>');
    $('.resignButton').click(resignClicked);

}

//these are the buttons responsible for going forward and backward in replay
function initReplayButtons(){
    $('#buttonContainer').append('<button type="button" class="button forwardButton">Forward</button><br>');
    $('.forwardButton').click(forwardClicked);
    $('#buttonContainer').append('<button type="button" class="button backwardButton">Backward</button>');
    $('.backwardButton').click(backwardClicked);

    $('#gameContainer').append('<div id=stopReplayContainer></div>');
    $('#stopReplayContainer').append('<button type="button" class="stopReplayButton">x</button>');
    $('.stopReplayButton').click(function() {
        gameEventHandler('stopReplay');
    });
}

function backwardClicked(event) {
    gameEventHandler('backwardClicked',event);
}

function forwardClicked(event) {
    gameEventHandler('forwardClicked',event);
}


//if the user resigns, post to server and write to the player console
function resignClicked(event) {
    gameEventHandler('resignClicked',event);
}

//if the user passes, post to the server and write to the player console
function passClicked(event) {
    gameEventHandler('passClicked',event);
}



function callRouter(event) {

    if (event.currentTarget.id == 'aboutUsButton') {
        window.location = './aboutus.html';
    }
    else if (event.currentTarget.id == 'logOutButton') {
        $.post("/user/logout", function(data, status) {
               data = JSON.parse(data);
               if (data.status == "OK") {
                   console.log("Logged out");
                   window.location = 'login.html';
               }
       });
    }
    else if (event.currentTarget.id == 'userCenterButton') {
        window.location = './usercenter.html';
    }
}


function getStatus() {
    $.post("/getStatus", function(data,status) {
           data = JSON.parse(data);
           if (data.login == "yes") {
               console.log("Status is logged in");
               loggedIn = true;
               username = data.username;
           } else {
               console.log("Status is logged out");
               loggedIn = false;
           }
           updateNavBar();
    });
}



function initTimer(blackTime,whiteTime, turn) {
    timer = new Timer(blackTime,whiteTime,turn);
    var myvar = setInterval(function() {
        gameEventHandler('updateTime');
    },1000);
}

function showNavBar() {
    $('#navbar').append('<ul id=navbarList><li id=aboutUsButton class=navbarItem>About Us</li></ul>');
    $('#aboutUsButton').click(callRouter);
}

function updateNavBar() {
    if (loggedIn == true) {
        if ($('#logOutButton').length) {} else {
            $('#navbarList').append('<li id=logOutButton class=navbarItem>Logout</li><li id=userCenterButton class=navbarItem>User Center</li>');
            $('#logOutButton').click(callRouter);
            $('#userCenterButton').click(callRouter);
        }
    }
    if (loggedIn == false) {
        if ($('#logOutButton').length) {
            $('#logOutButton').remove();
            $('#userCenterButton').remove();
        }
    }
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
    $('#playerConsole').prepend(text + '<br>');
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
        $('#boardContainer').css('margin-left', $('#gameContainer').width()*(1/100));


        $('#dataContainer').width($('#gameContainer').width()-$('#boardContainer').width()-$('#gameContainer').width()*(4/100));
        $('#dataContainer').height($('#boardContainer').height());
        $('#dataContainer').css('margin-left', $('#gameContainer').width()*(3/100));




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
    $('#playerTable').height($('#playerContainer').height()*(1/2));
    $('#playerTable').css('font-size',$('#playerTable').width()*.06);
    $('#playerTable td').css('padding',$('#playerTable').width()*.04);
    $('#playerTable th').css('padding',$('#playerTable').width()*.04);

    //set the button container based on the above bounds
    $('#buttonContainer').css('top', $('#playerContainer').height());
    $('#buttonContainer').height($('#dataContainer').height()-$('#playerContainer').height());
    $('#buttonContainer').width($('#dataContainer').width());


    //set the buttons css
    $('.button').css('margin-top', $('#buttonContainer').height()*.05);
    $('.button').css('margin-left', $('#buttonContainer').height()*.05);
    $('.button').css('margin-right', $('#buttonContainer').height()*.05);

    $('.button').css('width', $('#buttonContainer').width()*.9);

    $('.button').css('padding-top', $('.button').width()*(10/130));
    $('.button').css('padding-bottom', $('.button').width()*(10/130));
    $('.button').css('font-size', $('.button').width()*.1);
    $('.button').css('border-radius', $('.button').width()*(1000/130));

    //set the game replay button
    $('#stopReplayContainer').width($('#boardContainer').width()*.05);
    $('#stopReplayContainer').height($('#boardContainer').width()*.05);
    $('.stopReplayButton').width($('#stopReplayContainer').width()*.4);
    $('.stopReplayButton').height($('#stopReplayContainer').height()*.5);
    $('.stopReplayButton').css('font-size',$('#stopReplayButton').height());



    //create the console window
    $('#playerConsole').width($('#playerContainer').width());
    $('#playerConsole').height($('#playerContainer').height()-$('#playerTable').height());
    $('#playerConsole').css('top',$('#playerTable').height());
    $('#playerConsole').css('font-size',$('#playerConsole').width()*(5/100));

}
