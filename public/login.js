$(document).ready(function() {
    showWelcome();
});

const globals = {
    wantsHotseat: false
};

//show the welcome page
function showWelcome() {


    $.post("/getStatus", function(data,status) {

        data = JSON.parse(data);
        if (data.login == "yes") {
           showMenuBar("logged in");
          // showLogout();
           console.log("Logged in");
        } else {
           showMenuBar();
        }

           $('body').append('<div class="title"><div class="title_section1">WELCOME TO</div><div class="title_section2">GO</div><div class="title_section3">BY DEEPFRIEDMILK</div></div>');

           $('body').append('<div class="startPageButtons"><button type="button" class="button" id="playAIB">Player vs AI</button><br>'+
                            '<button type="button" class="button" id="playHSB">Player vs Player</button><br></div>');




           $('#playAIB').on('click', function() {
                $.post("/playAIB", function(data, status) {
                    data = JSON.parse(data);
                    if (data.status == "noSession") {
                        $('body').children().remove();
                        showSignOptions();
                        globals.wantsHotseat = false;
                    }
                    else {
                        window.location = data.redirect;
                    }
                });
            });


           $('#playHSB').on('click', function() {
                $.post("/playHSB", function(data, status) {
                    data = JSON.parse(data);
                    if (data.status == "noSession") {
                        $('body').children().remove();
                        showSignOptions();
                        globals.wantsHotseat = true;
                    }
                    else {
                        window.location = data.redirect;
                    }
                });
            });

    });




}

function showSignOptions () {

    $.post("/getStatus", function(data,status) {

        data = JSON.parse(data);
        if (data.login == "yes") {
           showMenuBar("logged in");
           // showLogout();
           console.log("Logged in");
        } else {
           showMenuBar();
        }

        $('body').append('<button class="backButton" id="signOptionsGoBack"><</button><br>');

        $('body').append('<div class="signoption_buttons">'+
                        '<button type="button" class="button" id="loginOptionB">Login</button><br>'+
                        '<button type="button" class="button" id="signOptionB">Sign up</button><br>'+
                        '<button type="button" class="button" id="guestOptionB">Proceed as guest</button><br>'+
                        '</div>');

        $('#signOptionsGoBack').on('click', function() {
            $('body').children().remove();
            showWelcome();
        });

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
            //window.location = '/gamepage.html';
            showMainMenu();
        });

    });

}

//show the signup page
function showSignUp() {
    $.post("/getStatus", function(data,status) {

        data = JSON.parse(data);
        if (data.login == "yes") {
           showMenuBar("logged in");
           // showLogout();
           console.log("Logged in");
        } else {
           showMenuBar();
        }


        $('body').append('<button class="backButton" id="signUpGoBack"><</button>');

        $('body').append('<div class="signup_form_div">'+
                        '<p class="username_label" id="usern_signup_label">Username</p>'+
                        '<input type=text id="usern_signup_textbox"><br>'+
                        '<p class="password_label" id="pw_signup_label">Password</p>'+
                        '<input type=text id="pw_signup_textbox"><br>'+
                        '</div>');

        $('body').append('<div class="signupSubmitB_div">'+
                        '<button type="button" class="button" id="signUpSubmitB">Sign up</button>'+
                        '</div>');

        $('#signUpGoBack').on('click', function() {
            $('body').children().remove();
            showSignOptions();
        });

        $('#signUpSubmitB').on('click', function() {
            var username = $('#usern_signup_textbox').val();
            var password = $('#pw_signup_textbox').val();
            var signUpData = {
                'username' : username,
                'password' : password
            }

            $.post("/signUp", signUpData, function(data, status){
                data = JSON.parse(data);
                if (data.status == "invalidUsername") {
                    $('body').append('<h3>Invalid username</h3>')
                } else {
                    //window.location = data.redirect;
                    $('body').children().remove();
                    showMainMenu();
                }
            });
        });
    });
}


//show the login page
function showLogin() {
    $.post("/getStatus", function(data,status) {

       data = JSON.parse(data);
       if (data.login == "yes") {
           showMenuBar("logged in");
           // showLogout();
           console.log("Logged in");
       } else {
           showMenuBar();
       }


        $('body').append('<button class="backButton" id="loginGoBack"><</button>');

        $('body').append('<p class="username_label" id="usern_login_label">Username</p>');
        $('body').append('<input type=text id="usern_login_textbox"><br>')
        $('body').append('<p class="password_label" id="pw_login_label">Password</p>');
        $('body').append('<input type=text id="pw_login_textbox"><br>');
        $('body').append('<button type="button" class="button" id="loginSubmitB">Log in</button>');

        $('#loginGoBack').on('click', function() {
            $('body').children().remove();
            showSignOptions();
        });

        $('#loginSubmitB').on('click', function() {
            var username = $('#usern_login_textbox').val();
            var password = $('#pw_login_textbox').val();
            var loginData = {
                'username' : username,
                'password' : password
            }

            $.post("/login", loginData, function(data, status){
                data = JSON.parse(data);
                if (data.status == "invalidLogin") {
                    //could be an alert message
                    $('body').append('<p>Invalid login</p>')
                } else {
                    //window.location = data.redirect;
                    $('body').children().remove();
                    showMainMenu();

                }
            });
        });
    });
}

/*//show the logout option
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
}*/

//show menu bar
function showMenuBar(login) {

    if (login == "logged in") {
        $('body').append('<ul>' +
                         '<li><a id="logoutB">Log Out</a></li>' +
                         '<li><a id="userCenter" href="/usercenter.html">User Center</a></li>' +
                         '<li><a id="aboutUs" href="/aboutus.html">About Us</a></li>' +
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



        $('#userCenter').on('click', function() {
            location.href="/usercenter.html";
        });

        $('#aboutUs').on('click', function() {
            location.href="/aboutus.html";
        });

    }

    else {
        $('body').append('<ul>' +
                         '<li><a id="aboutUs">About Us</a></li>' +
                         '</ul>');

        $('#aboutUs').on('click', function() {
             location.href="/aboutus.html";
        });
    }

}


//go to user center
//redirect to usercenter.html
//usercenter.html should know whether user has logged in to customerize the nav bar


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
        $('body').append('<input type=text><br>');


        $('#userCenterGoBack').on('click', function() {
            window.history.back();
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
             window.history.back();
        });

    });
}


//main menu for game settings
function showMainMenu() {
    $.post("/getStatus", function(data,status) {

       data = JSON.parse(data);
       if (data.login == "yes") {
           showMenuBar("logged in");
           // showLogout();
           console.log("Logged in");
       } else {
           showMenuBar();
       }

        //go back button
        $('body').append('<button class="backButton" id="mainMenuGoBack"><</button>');

        //board size selector
       $('body').append('<p class="mainmenu_label" id="mainmenu_top_label">Select board size :</p>');

       $('body').append('<ul class="boardsize_ul">'+
          '<li><input type="radio" id="size9" name="boardsize_selector">'+
          '<label for="size9">9*9</label><div class="check"></div></li>'+

          '<li><input type="radio" id="size13" name="boardsize_selector">'+
          '<label for="size13">13*13</label><div class="check"><div class="inside"></div></div></li>'+

          '<li><input type="radio" id="size19" name="boardsize_selector">'+
          '<label for="size19">19*19</label><div class="check"><div class="inside"></div></div></li>'+
          '</ul>');


       //Go board color selector
       $('body').append('<p class="mainmenu_label" id="mainmenu_color_label">Select colour of Go board :</p>');

       $('body').append('<ul class="boardcolor_ul">'+
          '<li><input type="radio" id="color_yellow" name="boardcolor_selector">'+
          '<label for="color_yellow">Yellow</label><div class="check"></div></li>'+

          '<li><input type="radio" id="color_white" name="boardcolor_selector">'+
          '<label for="color_white">White</label><div class="check"><div class="inside"></div></div></li>'+

          '<li><input type="radio" id="color_blue" name="boardcolor_selector">'+
          '<label for="color_blue">Blue</label><div class="check"><div class="inside"></div></div></li>'+
          '</ul>');



        $('body').append('<button class="button" id="startGameB">Start Game</button>');


       $('#startGameB').on('click', function() {
           window.location = "/gamepage.html";

           // TODO: Shiyi make this take sizes based on the page options
           var boardSizeSelected = $("input[type='radio'][name='boardsize_selector']:checked").val();
           var newGameParameters = {size: boardSizeSelected, hotseat: globals.wantsHotseat};

           $.post("/newGame", newGameParameters, function(data, status) {
               document.cookie = "boardColor=" + $("input[type='radio'][name='boardcolor_selector']:checked").val();
               window.location = '/gamepage.html';
           });
      });

        //NEEDS DEBUGGING!!!!!!!!!!!
       $('#mainMenuGoBack').on('click', function() {
            $('body').children().remove();
            showSignOptions();
        });

    });
}
