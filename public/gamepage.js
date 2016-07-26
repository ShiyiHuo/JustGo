var gameboard;
var loggedIn = true;
var username = "player1";
var timer;

var COLOR = {
    black: 1,
    white: 2
}

$(document).ready(function() {
    // show nav bar
    $('#navbar').append('<ul id=navbarList><li id=aboutUsButton class=navbarItem>About Us</li></ul>');
    $('#aboutUsButton').click(function() {
        window.location = '/aboutus.html';
    });
    
    // get login status and update nav bar
    $.post("/getStatus", function(data, status) {
        data = JSON.parse(data);
        if (data.login == "yes") {
            loggedIn = true;
            username = data.username;
        } else {
            loggedIn = false;
        }
        // update nav bar
        if (loggedIn == true) {
            if ($('#logOutButton').length) {} else {
                $('#navbarList').append('<li id=logOutButton class=navbarItem>Logout</li><li id=userCenterButton class=navbarItem>User Center</li>');
                $('#logOutButton').click(function() {
                    $.post("/user/logout", function(data, status) {
                        data = JSON.parse(data);
                        if (data.status == "OK") {
                            console.log("Logged out");
                            window.location = 'login.html';
                        }
                    });
                });
                $('#userCenterButton').click(function() {
                    window.location = './usercenter.html';
                });
            }
        } else {
            if ($('#logOutButton').length) {
                $('#logOutButton').remove();
                $('#userCenterButton').remove();
            }
        }
    });

    // get game state
    $.get("/game", function(data, status) {
        longpoll();

        // init board
        initBoard(data.board.length);
        gameboard.updateBoard(data.board);

        // init timers
        timer = new GameTimer(data.blackMsRemaining, data.whiteMsRemaining);
        if (data.turn == COLOR.black) {
            timer.startBlackTimer();
        } else {
            timer.startWhiteTimer();
        }
        setInterval(function() {
            $('#whiteTime').empty();
            $('#whiteTime').append(timer.getWhiteTime());
            $('#blackTime').empty();
            $('#blackTime').append(timer.getBlackTime());
        }, 100);
        
        // init scores
        updateScore(data.blackScore, data.whiteScore);
        
        if (data.winner) { // TODO: ???
            endGame(data);
        }
    });
    $(window).trigger('resize');
});

var gameActive = true;
function longpoll() {
    $.ajax({
        method: 'GET',
        url: '/game/longpoll',
        success: function(data) {
            if (!data.winner) { // game active and move occured
                
                if (data.pass == true) { // DEBUG
                    writePC('AI passed');
                } else {
                    gameboard.drawPiece(data.x, data.y, data.color);
                    gameboard.removePieces(data.capturedPieces);
                }
                updateScore(data.blackScore, data.whiteScore);
                if (data.color == COLOR.black) {
                    timer.stopBlackTimer();
                    timer.startWhiteTimer();
                } else {
                    timer.stopWhiteTimer();
                    timer.startBlackTimer();
                }

            }
            if (data.winner) { // game has ended
                gameActive = false;
                endGame(data);
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

function updateScore(blackScore, whiteScore) {
    $('#blackScore').empty();
    $('#blackScore').append(blackScore);
    $('#whiteScore').empty();
    $('#whiteScore').append(whiteScore);
}

function initBoard(size) {
    // init player container for user scores, usernames, timers, etc
    $('#playerTable').append('<table id="table" frame="box" rules="none" border="0">');
    $('#playerTable').append('<tr> <th>Color</th> <th>Players</th> <th>Score</th> <th>Time</th></tr>');
    $('#playerTable').append('<tr> <td>Black</td><td>'+ username +'</td><td id="blackScore"></td><td id="blackTime"></td></tr>');
    $('#playerTable').append('<tr> <td>White</td><td>Player2</td><td id="whiteScore"></td><td id="whiteTime"></td></tr>');
    $('#playerTable').append('</table>');

    // init buttons
    $('#buttonContainer').append('<button type="button" class="button passButton">Pass</button><br>');
    $('.passButton').click(
        function (event) {
            $.post('/game/makeClientMove', {
                x: 0,
                y: 0,
                pass: true
            }, function(data, status) {
                if (data.error) {
                    writePC(data.error);
                } else {
                    gameboard.drawPiece(position.x, position.y, data.color);
                    gameboard.removePieces(data.capturedPieces);
                }
            })
        }
    );
    $('#buttonContainer').append('<button type="button" class="button resignButton">Resign</button>');
    $('.resignButton').click(
    function (event) {
        $.post('/game/resign', {
        }, function(data, status) {
            if (data) {
                writePC(data);
            }
        })
    });

    applyStyle();

    // init board stuff
    var canvas = document.createElement("CANVAS");
    canvas.id = "canvas";
    canvas.width = $('#boardContainer').width();
    canvas.height = $('#boardContainer').height();
    $(canvas).mousemove(function (event) {
        var position = gameboard.getIntersection(event.clientX,event.clientY);
        if (typeof position !== 'undefined') {
            if (gameboard.board[position.y][position.x] == 0) {
                gameboard.drawTempPiece(position.x,position.y);
            } else {
                gameboard.drawCurrentBoard();
            }
        }
    });
    $(canvas).mouseleave(function (event) {
        gameboard.drawCurrentBoard();
    });
    $(canvas).click(
        function (event) {
            var position = gameboard.getIntersection(event.clientX, event.clientY);
            if (position) {
                if (gameboard.board[position.y][position.x] != 0) { // not empty
                    writePC("You cannot place a piece here<br>");
                } else {
                    var move = {x: position.x, y: position.y};
                        $.post("/game/makeClientMove", move, function(data,status) {
                            if (data.error) {
                                writePC(data.error);
                            } else {

                                updateScore(data.blackScore, data.whiteScore);
                                if (data.color == COLOR.black) {
                                    timer.stopBlackTimer();
                                    timer.startWhiteTimer();
                                } else {
                                    timer.stopWhiteTimer();
                                    timer.startBlackTimer();
                                }
                                gameboard.drawPiece(position.x, position.y, data.color);
                                gameboard.removePieces(data.capturedPieces);
                            }
                    });
                }
            }
        }
    );
    $('#boardContainer').append(canvas);
    var color = getCookie("boardColor");
    if (color == undefined) {
        color = white;
    }
    gameboard = new Board(size, $('#boardContainer').width(), canvas, color);
    gameboard.drawCurrentBoard();
    
    $(window).resize(function (event) {
        applyStyle();
        canvas.width = $('#boardContainer').width();
        canvas.height = $('#boardContainer').height();
        gameboard.calibrate(canvas,$('#boardContainer').width());
        gameboard.drawCurrentBoard();
    });
}

function endGame(data) {
    timer.stopBlackTimer();
    timer.stopWhiteTimer();
    var winner = data.winner == 1? "Black" : "White";
    writePC("winner is: " + winner + '<br>' + " whiteScore: " + data.scores.white + '<br>' +" blackScore: " + data.scores.black);
    showEndGameOpts();
}

function showEndGameOpts() {
    // show end game options
    $('#container').append('<div id="endgameTrans"></div>');
    $('#container').append('<div id="endgameOpts"></div>');
    $('#endgameOpts').width($('#container').width()*.3);
    $('#endgameOpts').height($('#container').height()*.15);

    //endgame buttons replay and new game
    $('#endgameOpts').append('<button type="button" class="endgameButton" id="replay">Replay Game History</button><br>');
    $('#endgameOpts').append('<button type="button" class="endgameButton" id="newGame">Main Menu</button>');

    //button styling
    $('.endgameButton').width($('#endgameOpts').width()*.9);
    $('.endgameButton').height($('#endgameOpts').height()*.25);
    $('.endgameButton').css('margin-left','0 auto');
    $('.endgameButton').css('margin-right','0 auto');
    $('.endgameButton').css('margin-top', $('#endgameOpts').height()*.1);

    //button functionality
    $('#replay').click(function() {
        $.get('/game/moveHistory', function(data, status) {     
            // clear stuff
            $('#boardContainer').empty();
            $('#buttonContainer').empty();
            $('#endgameTrans').remove();
            $('#endgameOpts').remove();

            // init replay buttons for going forward and backward in replay
            var replayPosition = 0;
            $('#buttonContainer').append('<button type="button" class="button forwardButton">Forward</button><br>');
            $('.forwardButton').click(function() {
                if (replayPosition + 1 >= data.length) {
                    writePC("Cannot move forward.")
                } else {
                    replayPosition++;
                    var move = data[replayPosition];
                    console.log(move);
                    if (!move.pass) {
                        gameboard.drawPiece(move.x, move.y, move.color);
                    }
                    gameboard.removePieces(move.capturedPieces);
                }
            });
            $('#buttonContainer').append('<button type="button" class="button backwardButton">Backward</button>');
            $('.backwardButton').click(function() {
                if (replayPosition - 1 < 0) {
                    writePC("Cannot move backward.")
                } else {
                    var currentMove = data[replayPosition];
                    gameboard.drawPieces(currentMove.capturedPieces); // redraw capturedPieces
                    if (!currentMove.pass) {
                        gameboard.removePiece(currentMove.x, currentMove.y); // remove current piece
                    }
                    console.log(currentMove);
                    replayPosition--;
                }
            });

            $('#gameContainer').append('<div id=stopReplayContainer></div>');
            $('#stopReplayContainer').append('<button type="button" class="stopReplayButton">x</button>');
            $('.stopReplayButton').click(function() {
                $('#buttonContainer').empty();
                $('#stopReplayContainer').remove();
                showEndGameOpts();
            });

            // create replay board
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
            gameboard = new Board(gameboard.boardSize, $('#boardContainer').width(), canvas, color);
            gameboard.drawCurrentBoard();    
        });
    });
    $('#newGame').click(function() {
        window.location = '/';
    });
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
    var hwMin = 1/2;
    //the width is greater than the height
    if ($('#container').width() >= $('#container').height()) {

        //the width is greater than the height by the ratio
        if (($('#container').width())/($('#container').height()) > (1+hwMin)) {
            $('#gameContainer').height($('#container').height());
            $('#gameContainer').width($('#container').height()*(1+hwMin));
        } else { //the width is less than the height by the ratio
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
    } else { //the height is greater than the width
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