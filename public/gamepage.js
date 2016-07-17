var gameboard = undefined;

$(document).ready(function() {
    $.get("/game", function(data, status) {
        if (data) {
            longpoll();
            initBoard(data.board.length);
            gameboard.updateBoard(data.board);
            initPlayerContainer();
            initButtons();

        } else {
            /*
            var size = 19;
            var hotseat = true;
            $.post("/newGame", { size : size, hotseat : hotseat }, function(data, status) {
                initBoard(size);
                longpoll();
                initPlayerContainer();
                initButtons();
            }); */
        }
    });
});

function initPlayerContainer(){
    $('.playerContainer').append('<table id=playerTable>');
    $('.playerContainer').append('<tr> <th>Pic</th> <th>Players</th> <th>Score</th> <th>Time</th></tr>');
    $('.playerContainer').append('<tr> <td>Black</td><td>Player1</td><td>Score</td><td>Time</td></tr>');
    $('.playerContainer').append('<tr> <td>White</td><td>Player1</td><td>Score</td><td>Time</td></tr>');
    $('.playerContainer').append('</table>');
}

function initButtons(){
    $('.playerContainer').append('<button type="button" class="button passButton">Pass</button>');
    $('.passButton').click(passClicked);
    $('.playerContainer').append('<button type="button" class="button resignButton">Resign</button>');
    $('.resignButton').click(resignClicked);

}

function resignClicked(event) {
    console.log("Resign clicked");
    $.post("/resign", function(data) {
        window.alert(data);
    });
}

function passClicked(event) {
    console.log("Pass clicked");
    var move = {x: 0, y: 0, pass: true};
    $.post("/makeClientMove", move, function(data,status) {
        if (!data.board) {
            window.alert(data); // ??????
        } else {
            gameboard.updateBoard(data.board);
            $('#dataContainer').append("whiteTime: " + data.whiteTime + " blackTime: " + data.blackTime + "\n");
        }
    });
}

function initBoard(size) {
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

    var canvas = document.getElementById('canvas');
    canvas.width = $('#boardContainer').width();
    canvas.height = $('#boardContainer').height();
    gameboard.calibrate(canvas,$('#boardContainer').width());
    gameboard.drawCurrentBoard();
}

function boardClicked(event) {

    var position = gameboard.getIntersection(event.clientX, event.clientY);

    if (position) {
        if (gameboard.board[position.y][position.x] != 0) {
            console.log("You cannot place a piece here");
        } else {
            var move = {x: position.x, y: position.y};
            $.post("/makeClientMove", move, function(data,status) {
                if (!data.board) {
                    window.alert(data); // ??????
                } else {
                    gameboard.updateBoard(data.board);
                    $('#dataContainer').append("whiteTime: " + data.whiteTime + " blackTime: " + data.blackTime + "\n");
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
            }
            if (data.winner) { // game has ended
                var winner = data.winner == 1? "Black" : "White";
                window.alert("winner is: " + winner + " whiteScore: " + data.whiteScore + " blackScore: " + data.blackScore);
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
