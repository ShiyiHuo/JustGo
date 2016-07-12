$(document).ready(function() {

    showWelcome();



});

//show the welcome page
function showWelcome() {

    showMenuBar();

    $('body').append('<h1>Welcome to Go by DeepFriedMilk</h1>');
    $('body').append('<h2>Select game mode</h2>');
    $('body').append('<button type="button" class="button" id="playAIB">Player vs AI</button><br>');
    $('body').append('<button type="button" class="button" id="playHSB">Player vs Player</button><br>');

    $.post("/getStatus", function(data,status) {

        data = JSON.parse(data);
        if (data.login == "yes") {
                showLogout();   //show menu bar here
                console.log("Logged in");
        }
    });


    $('#playAIB').on('click', function() {
        $.post("/playAIB", function(data, status) {
            data = JSON.parse(data);
            if (data.status == "noSession") {
                $('body').children().remove();
                showSignOptions();
            }
            else {
                window.location = data.redirect;
            }
        });
    });

}

function showSignOptions () {
    $('body').append('<button type="button" class="button" id="loginOptionB">Login</button><br>');
    $('body').append('<button type="button" class="button" id="signOptionB">Sign up</button><br>');
    $('body').append('<button type="button" class="button" id="guestOptionB">Proceed as guest</button><br>');

    $('#loginOptionB').on('click', function() {
        $('body').children().remove();
        showLogin();
    });

    $('#signOptionB').on('click', function() {
        $('body').children().remove();
        showSignUp();
    });

    $('#guestOptionB').on('click', function() {
        $('body').children().remove();
        window.location = '/gamepage.html';
    });

}

//show the signup page
function showSignUp() {
    $('body').append('<h2>Sign Up</h2>');
    $('body').append('<h3>Username</h3>');
    $('body').append('<input type=text id="username"><br>')
    $('body').append('<h3>Password</h3>');
    $('body').append('<input type=text id="password"><br>');
    $('body').append('<button type="button" class="button" id="signUpSubmitB">submit</button>');

    $('#signUpSubmitB').on('click', function() {
        var username = $('#username').val();
        var password = $('#password').val();
        var signUpData = {
            'username' : username,
            'password' : password
        }

        $.post("/signUp", signUpData, function(data, status){
            data = JSON.parse(data);
            if (data.status == "invalidUsername") {
                $('body').append('<h3>Invalid username</h3>')
            } else {
                window.location = data.redirect;
            }
        });
    });
}


//show the login page
function showLogin() {
    $('body').append('<h2>Login</h2>');
    $('body').append('<h3>Username</h3>');
    $('body').append('<input type=text id="username"><br>')
    $('body').append('<h3>Password</h3>');
    $('body').append('<input type=text id="password"><br>');
    $('body').append('<button type="button" class="button" id="loginSubmitB">submit</button>');

    $('#loginSubmitB').on('click', function() {
        var username = $('#username').val();
        var password = $('#password').val();
        var loginData = {
            'username' : username,
            'password' : password
        }

        $.post("/login", loginData, function(data, status){
            data = JSON.parse(data);
            if (data.status == "invalidLogin") {
                $('body').append('<p>Invalid login</p>')
            } else {
                window.location = data.redirect;
            }
        });
    });
}

//show the logout option
function showLogout() {
    $('body').append('<button type="button" class="button" id="logoutB">logout</button>');
    $('#logoutB').on('click', function() {
        $.post("/logout", function(data, status) {
            data = JSON.parse(data);
            if (data.status == "OK") {
                console.log("Logged out");
                window.location = data.redirect;
            }
        });
    });
}

//show menu bar
function showMenuBar() {
    $('body').append('<ul>' +
                     '<li><a href="#">Home</a></li>' +
                     '<li><a href="#">News</a></li>' +
                     '<li><a href="#">Contact</a></li>' +
                     '<li><a href="#">About</a></li>' +
                     '</ul>');
    
    
}













