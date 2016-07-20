var path = new Array;
var loggedIn = false;
var username;
var hotseatSelected = false;

$(document).ready(function() {
    initiatePage();
    showBackButton();
    showNavBar(loggedIn);
});

function initiatePage() {
    getStatus();
    showLogo();
}

function callRouter(event) {

    if (event.currentTarget.id == 'startGameB') {

        var boardSizeSelected = $("input[type='radio'][name='size']:checked").val();
        console.log(boardSizeSelected);
        var newGameParameters = {size: boardSizeSelected, hotseat: hotseatSelected};
        document.cookie = "boardColor=" + $("input[type='radio'][name='color']:checked").val();

        $.post("/newGame", newGameParameters, function(data, status) {
            window.location = '/gamepage.html';
        });
    }

    console.log("Router called on " + event.currentTarget.id);
    path.push(event.currentTarget.id);

    if (event.currentTarget.id == 'goBack') {
        clearPage();

        if (path.length <= 2) {
            path.pop();
            initiatePage();
            console.log("Going back to welcome screen");
        }
        else {
            path.pop();
            path.pop();
            event.currentTarget.id = path.pop();
            console.log("Going back to " + event.currentTarget.id)
            callRouter(event);
        }
    }

    else if (event.currentTarget.id == 'logoContainer') {
        clearPage();
        console.log("Routing to player options");
        showPlayerOption();
        createButtonEvent();

    }

    else if (event.currentTarget.id == 'playAIB') {
        clearPage();
        hotseatSelected = false;
        if (loggedIn == true) {
            console.log("Logged in. Routing to board options.");
            showBoardOption();
        } else {
            console.log("Logged out. Routing to login signup options");
            showLoginSignUpOption();
        }
        createButtonEvent();

    }

    else if (event.currentTarget.id == 'playHSB') {
        clearPage();
        hotseatSelected = true;
        if (loggedIn == true) {
            console.log("Logged in. Routing to board options.");
            showBoardOption();
        } else {
            console.log("Logged out. Routing to login signup options");
            showLoginSignUpOption();
        }
        createButtonEvent();

    }

    else if (event.currentTarget.id == 'loginOptionB') {
        clearPage();
        console.log("Routing to login.");
        showLogin();
        createButtonEvent();

    }

    else if (event.currentTarget.id == 'signOptionB') {
        clearPage();

        console.log("Routing to sign up.");
        showSignUp();
        createButtonEvent();

    }

    else if (event.currentTarget.id == 'guestOptionB') {

        var uName = $('#usern_login_textbox').val();
        var pass = $('#pw_login_textbox').val();
        var loginData = {
            'username' : 'guest',
            'password' : 'guest'
        }

        $.post("/login", loginData, function(data, status) {
            data = JSON.parse(data);
            if (data.status == "invalidLogin") {
                clearPage();
                showLoginSignUpOption();
                $('#loginOptionContainer').append('<p>Invalid login</p>');
                createButtonEvent();

            } else {
                clearPage();
                getStatus();
                console.log("Routing to board options");
                showBoardOption();
                createButtonEvent();

            }
        });
    }

    else if (event.currentTarget.id == 'loginSubmitB') {
        var uName = $('#usern_login_textbox').val();
        var pass = $('#pw_login_textbox').val();
        var loginData = {
            'username' : uName,
            'password' : pass
        }
        console.log("Attempting to login" + uName);
        $.post("/login", loginData, function(data, status) {
            data = JSON.parse(data);
            if (data.status == "invalidLogin") {
                clearPage();
                showLogin();
                $('#loginContainer').append('<p>Invalid login</p>');
                createButtonEvent();

            } else {
                clearPage();
                getStatus();
                console.log("Routing to board options");
                showBoardOption();
                createButtonEvent();
            }
        });

    }
    else if (event.currentTarget.id == 'signUpSubmitB') {
        var uName = $('#usern_signup_textbox').val();
        var pass = $('#pw_signup_textbox').val();
        var signUpData = {
            'username' : uName,
            'password' : pass
        }
        console.log("Attempting to sign up " + uName);

        $.post("/signUp", signUpData, function(data, status) {
            data = JSON.parse(data);
            if (data.status == "invalidUsername") {
                clearPage();
                showSignUp();
                $('#signUpContainer').append('<p>Invalid signup</p>');
                createButtonEvent();

            } else {
                clearPage();
                getStatus();
                console.log("Routing to board options");
                showBoardOption();
                createButtonEvent();
            }
        });
    }
    else if (event.currentTarget.id == 'logOutButton') {
        $.post("/logout", function(data, status) {
               data = JSON.parse(data);
               if (data.status == "OK") {
                   console.log("Logged out");
                   location.reload();
               }
       });
    }
    else if (event.currentTarget.id == 'aboutUsButton') {
        console.log('This button doesnt do anything');
        location.reload();
    }
}

function getStatus() {
    $.post("/getStatus", function(data,status) {
           data = JSON.parse(data);
           if (data.login == "yes") {
               console.log("Status is logged in");
               loggedIn = true;
           } else {
               console.log("Status is logged out");
               loggedIn = false;
           }
           updateNavBar();
    });
}


function createButtonEvent() {
    $('.button').on('click',callRouter);
}

function clearPage() {
    $('#container').empty();
    showBackButton();
}


//this is the nav bar at the top of screen, username is name of logged in
//username is undefined if user not logged in
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

function showLogo() {
    $('#container').append('<div id=logoContainer class=container></div>');
    $('#logoContainer').append('<div class="title_section1">WELCOME TO</div><div class="title_section2">GO</div><div class="title_section3">BY DEEPFRIEDMILK</div>');
    $('#logoContainer').click(callRouter);
}

function showPlayerOption() {
    $('#container').append('<div id=playerContainer class=container></div>');
    $('#playerContainer').append('<button type="button" class="button" id="playAIB">Player vs AI</button><br>');
    $('#playerContainer').append('<button type="button" class="button" id="playHSB">Player vs Player</button><br>');
}

function showLoginSignUpOption() {
    $('#container').append('<div id=loginOptionContainer class=container></div>');
    $('#loginOptionContainer').append('<button type="button" class="button" id="loginOptionB">Login</button><br>');
    $('#loginOptionContainer').append('<button type="button" class="button" id="signOptionB">Sign up</button><br>');
    $('#loginOptionContainer').append('<button type="button" class="button" id="guestOptionB">Proceed as guest</button><br>');
}

function showLogin() {
    $('#container').append('<div id=loginContainer class=container></div>');
    $('#loginContainer').append('<p class="username_label" id="usern_login_label">Username</p>');
    $('#loginContainer').append('<input type=text id="usern_login_textbox"><br>')
    $('#loginContainer').append('<p class="password_label" id="pw_login_label">Password</p>');
    $('#loginContainer').append('<input type=text id="pw_login_textbox"><br>');
    $('#loginContainer').append('<button type="button" class="button" id="loginSubmitB">Log in</button>');
}

function showSignUp() {

    $('#container').append('<div id=signUpContainer class=container></div>');
    $('#signUpContainer').append('<p class="username_label" id="usern_signup_label">Username</p>');
    $('#signUpContainer').append('<input type=text id="usern_signup_textbox"><br>')
    $('#signUpContainer').append('<p class="password_label" id="pw_signup_label">Password</p>');
    $('#signUpContainer').append('<input type=text id="pw_signup_textbox"><br>');
    $('#signUpContainer').append('<button type="button" class="button" id="signUpSubmitB">Sign up</button>');
}

function showBoardOption() {
    $('#container').append('<div id=boardOptionContainer class=container></div>');
    $('#boardOptionContainer').append('<p id="boardSizeLabel">Select board size</p>');
    $('#boardOptionContainer').append('<form action=""><input type="radio" name="size" value="9"> 9x9</input><input type="radio" name="size" value="13">13x13</input><input type="radio" name="size" value="19">19x19</input></form><br>');
    $('#boardOptionContainer').append('<p id="boardSizeLabel">Select board color</p>');
    $('#boardOptionContainer').append('<form action=""><input type="radio" name="color" value="red"> red</input><input type="radio" name="color" value="blue">blue</input><input type="radio" name="color" value="green">green</input></form><br>');
    $('#boardOptionContainer').append('<button class="button" id="startGameB">Start Game</button>');
}

function showBackButton() {

    $('#container').append('<div id=backButtonContainer class=container></div>');
    $('#backButtonContainer').append('<button class="backbutton" id="goBack"><</button><br>');
    $('.backbutton').on('click',callRouter);
}
