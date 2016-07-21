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

           $('body').append('<div class="title_section1">WELCOME TO</div><div class="title_section2">GO</div><div class="title_section3">BY DEEPFRIEDMILK</div>');

           $('body').append('<button type="button" class="button" id="playAIB">Player vs AI</button><br>');
           $('body').append('<button type="button" class="button" id="playHSB">Player vs Player</button><br>');




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

           $('body').append('<button type="button" class="button" id="loginOptionB">Login</button><br>');
           $('body').append('<button type="button" class="button" id="signOptionB">Sign up</button><br>');
           $('body').append('<button type="button" class="button" id="guestOptionB">Proceed as guest</button><br>');

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

           $('body').append('<p class="username_label" id="usern_signup_label">Username</p>');
           $('body').append('<input type=text id="usern_signup_textbox"><br>')
           $('body').append('<p class="password_label" id="pw_signup_label">Password</p>');
           $('body').append('<input type=text id="pw_signup_textbox"><br>');
           $('body').append('<button type="button" class="button" id="signUpSubmitB">Sign up</button>');

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
    });

   //go back button
   $('body').append('<button class="backButton" id="mainMenuGoBack"><</button>');

   //selectors
   $('body').append('<div id=sizeContainer></div>');
   $('body').append('<div id=colorContainer></div>');
   $('#sizeContainer').append('Select board size:');
   $('#sizeContainer').append('<form action=""><input type="radio" name="size" value="9"> 9x9</input><input type="radio" name="size" value="13">13x13</input><input type="radio" name="size" value="19">19x19</input></form>');
   $('#colorContainer').append('Select board color:');
   $('#colorContainer').append('<form action=""><input type="radio" name="color" value="red"> red</input><input type="radio" name="color" value="blue">blue</input><input type="radio" name="color" value="green">green</input></form>');


   $('body').append('<button class="button" id="startGameB">Start Game</button>');


       $('#startGameB').on('click', function() {

            // TODO: Shiyi make this take sizes based on the page options
            var boardSizeSelected = $("input[type='radio'][name='size']:checked").val();
            var newGameParameters = {size: boardSizeSelected, hotseat: globals.wantsHotseat};

            $.post("/newGame", newGameParameters, function(data, status) {
                document.cookie = "boardColor=" + $("input[type='radio'][name='color']:checked").val();
                window.location = '/gamepage.html';
            });

        });

           /*//NEEDS DEBUGGING!!!!!!!!!!!
           $('#mainMenuGoBack').on('click', function() {
                                   $('body').children().remove();
                                   showSignOptions();
                                   });

           });*/
}
