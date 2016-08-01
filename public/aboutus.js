$(document).ready(function() {
    $.post("/getStatus", function(data,status) {
        data = JSON.parse(data);
        if (data.login == "yes") {
            showMenuBar("logged in");
            // showLogout();
            console.log("Logged in");
        } else {
            showMenuBar();
        }
        $('body').append('<button class="backButton" onclick="aboutUsGoBack()"><</button>');

        $('body').append('<marquee behavior="scroll" direction="left" scrollamount="20">Created by DeepFriedMilk</marquee>');
    });

});



//show menu bar
function showMenuBar(login) {

    if (login == "logged in") {
        $('body').append('<div class="navbar_container"><ul>' +
                         '<li><a id="changeColorToWhite">White Background</a></li>'+
                         '<li><a id="changeColorToBlue">Blue Background</a></li>'+
                         '<li><a id="aboutUs" href="/aboutus.html">About Us</a></li>'+
                         '<li><a id="logoutB">Log Out</a></li>' +
                         '<li><a id="userCenter" href="/usercenter.html">User Center</a></li>' +
                         '</ul></div>');

        $('#logoutB').on('click', function() {
            $.post("/user/logout", function(data, status) {
                data = JSON.parse(data);
                if (data.status == "OK") {
                    console.log("Logged out");
                    window.location = data.redirect;
                }
            });
        });


        //use stack to go to previous page
        $('#userCenter').on('click', function() {
            location.href="/usercenter.html";
        });

        $('#aboutUs').on('click', function() {
            location.href="/aboutus.html";
        });

        $('#changeColorToWhite').on('click', function() {
             document.body.style.backgroundColor = 'white';   //White
        });

        $('#changeColorToBlue').on('click', function() {
             document.body.style.backgroundColor = '#cfecec';   //Pale Blue Lily
        });

    }

    else {
        $('body').append('<div class="navbar_container"><ul>' +
                         '<li><a id="changeColorToWhite">White Background</a></li>'+
                         '<li><a id="changeColorToBlue">Blue Background</a></li>'+
                         '<li><a id="aboutUs">About Us</a></li>' +
                         '</ul></div>');

        $('#aboutUs').on('click', function() {
             location.href="/aboutus.html";
        });

        $('#changeColorToWhite').on('click', function() {
             document.body.style.backgroundColor = 'white';   //White
        });

        $('#changeColorToBlue').on('click', function() {
             document.body.style.backgroundColor = '#cfecec';   //Pale Blue Lily
        });
    }

}


function aboutUsGoBack() {
  window.history.back();
}
