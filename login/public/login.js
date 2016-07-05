$(document).ready(function() {

    showWelcome();

});

//show the welcome page
function showWelcome() {
    $('body').append('<p>Welcome to Go by DeepFriedMilk</p>');
    $('body').append('<p>Select game mode</p>');
    $('body').append('<button type="button" id="playAIB">Player vs AI</button><br>');
    $('body').append('<button type="button" id="playHSB">Player vs Player</button><br>');

    $('#playAIB').on('click', function() {
        $.post("/playAIB", function(data, status) {
            data = JSON.parse(data);
            if (data.redirect == "noSession") {
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
    $('body').append('<button type="button" id="loginOptionB">Login</button><br>');
    $('body').append('<button type="button" id="signOptionB">Sign up</button><br>');
    $('body').append('<button type="button" id="guestOptionB">Proceed as guest</button><br>');

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
    $('body').append('<p>Sign Up</p>');
    $('body').append('<p>Username</p>');
    $('body').append('<input type=text id="username"><br>')
    $('body').append('<p>Password</p>');
    $('body').append('<input type=text id="password"><br>');
    $('body').append('<button type="button" id="signUpSubmitB">submit</button>');

    $('#signUpSubmitB').on('click', function() {
        var username = $('#username').val();
        var password = $('#password').val();
        var signUpData = {
            'username' : username,
            'password' : password
        }

        $.post("/signUp", signUpData, function(data, status){
            data = JSON.parse(data);
            if (data.redirect == "invalidUsername") {
                $('body').append('<p>Invalid username</p>')
            } else {
                window.location = data.redirect;
            }
        });
    });
}


//show the login page
function showLogin() {
    $('body').append('<p>Login</p>');
    $('body').append('<p>Username</p>');
    $('body').append('<input type=text id="username"><br>')
    $('body').append('<p>Password</p>');
    $('body').append('<input type=text id="password"><br>');
    $('body').append('<button type="button" id="loginSubmitB">submit</button>');

    $('#loginSubmitB').on('click', function() {
        var username = $('#username').val();
        var password = $('#password').val();
        var loginData = {
            'username' : username,
            'password' : password
        }

        $.post("/login", loginData, function(data, status){
            data = JSON.parse(data);
            if (data.redirect == "invalidLogin") {
                $('body').append('<p>Invalid login</p>')
            } else {
                window.location = data.redirect;
            }
        });
    });
}
