var gameboard = undefined;
var timer = undefined;
var aspectRatio = 15/10;

$(document).ready(function() {

    $.get("/game", function(data, status) {
        if (data) {
            longpoll();
            initBoard(data.board.length);
            //initTimer(data.whiteTime,data.blackTime,1); implement this
            initTimer(900000,900000,1);
            gameboard.updateBoard(data.board);
            score = {black: data.blackScore, white: data.whiteScore}
            updateScore(score);
        } else {
            var size = 19;
            var hotseat = true;
            $.post("/newGame", { size : size, hotseat : hotseat }, function(data, status) {
                initBoard(size);
                //initTimer(data.blackTime,data.whiteTime,1); implement this
                initTimer(900000,900000,1);
                longpoll();
            });
        }
    });
});

function initPlayerContainer(){
    $('#playerTable').append('<table id="table">');
    $('#playerTable').append('<tr> <th>Pic</th> <th>Players</th> <th>Score</th> <th>Time</th></tr>');
    $('#playerTable').append('<tr> <td>Black</td><td>Player1</td><td id="blackScore"></td><td id="blackTime"></td></tr>');
    $('#playerTable').append('<tr> <td>White</td><td>Player1</td><td id="whiteScore"></td><td id="whiteTime"></td></tr>');
    $('#playerTable').append('</table>');
}

function initButtons(){
    $('#buttonContainer').append('<button type="button" class="button passButton">Pass</button>');
    $('.passButton').click(passClicked);
    $('#buttonContainer').append('<button type="button" class="button resignButton">Resign</button>');
    $('.resignButton').click(resignClicked);

}

function resignClicked(event) {
    $.post("/resign", function(data) {
        writePC("Player resigned<br>");
    });
}

function passClicked(event) {
    var move = {x: 0, y: 0, pass: true};
    $.post("/makeClientMove", move, function(data,status) {
        if (!data.board) {
            window.alert(data); // ??????
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
    gameboard = new Board(size, $('#boardContainer').width(), canvas);
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

    var hwMin = 1/3

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
    $('#playerTable').height($('#playerContainer').height()*(1/3));
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
    $('#playerConsole').height($('#playerContainer').height()*(2/3));
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
                    window.alert(data); // ??????
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
            }
            if (data.winner) { // game has ended
                var winner = data.winner == 1? "Black" : "White";
                writePC("winner is: " + winner + " whiteScore: " + data.whiteScore + " blackScore: " + data.blackScore);
            }

        },
        complete: longpoll,
        timeout: 30000
    });
}




//show menu bar
function showMenuBar(login) {

    if (login == "logged in") {
        $('body').append('<ul>' +
                         '<li><a id="logoutB">Log Out</a></li>' +
                         '<li><a id="userCenter">User Center</a></li>' +
                         '<li><a id="aboutUs">About Us</a></li>' +
                         '</ul>');

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
        $('body').append('<ul>' +
                         '<li><a id="aboutUs">About Us</a></li>' +
                         '</ul>');

        $('#aboutUs').on('click', function() {
                         $('body').children().remove();
                         showAboutUs();
                         });
    }

}


//show user center
function showUserCenter() {
    $.post("/getStatus", function(data,status) {

           data = JSON.parse(data);
           if (data.login == "yes") {
           showMenuBar("logged in");
           // showLogout();
           console.log("Logged in");
           } else {
           showMenuBar();
           }

           $('body').append('<button class="backButton" id="userCenterGoBack"><</button>');

           $('body').append('<p class="usercenter_label">Username</p>');
           $('body').append('<input type=text><br>')
           $('body').append('<p class="usercenter_label">Score</p>');
           $('body').append('<input type=text><br>')
           $('body').append('<p class="usercenter_label">Wins/Losses</p>');
           $('body').append('<input type=text><br>')


           $('#userCenterGoBack').on('click', function() {
                                     history.go(-1);
                                     });


           });
}



//show about us
function showAboutUs() {
    $.post("/getStatus", function(data,status) {

           data = JSON.parse(data);
           if (data.login == "yes") {
           showMenuBar("logged in");
           // showLogout();
           console.log("Logged in");
           } else {
           showMenuBar();
           }

           $('body').append('<button class="backButton" id="aboutUsGoBack"><</button>');

           $('body').append('<input class="input-text" type="text" value="Your Name *"><br>');
           $('body').append('<input class="input-text" type="text" value="Your E-mail *"<br>');
           $('body').append('<textarea class="input-text text-area">Your Message *</textarea>');

           $('#aboutUsGoBack').on('click', function() {
                history.go(-1);
            });
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
    console.log("I am working");
    timer.clientUpdateTime();
    time = timer.returnTime();
    $('#blackTime').empty();
    $('#blackTime').append(time.blackTime);
    $('#whiteTime').empty();
    $('#whiteTime').append(time.whiteTime);
}

function writePC(text) {
    $('#playerConsole').prepend(text);
}
