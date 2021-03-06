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
        $('body').append('<button class="backButton" onclick="userCenterGoBack()"><</button>');
        $('body').append('<p class="usercenter_label">Username :<span id="usercenter_username"></span></p>');
        $('body').append('<p class="usercenter_label">Skill level :<span id="usercenter_skilllevel"></span></p>');
        $('body').append('<p class="usercenter_label">Wins :<span id="usercenter_wins"></span></p>');
        $('body').append('<p class="usercenter_label">Losses :<span id="usercenter_losses"></span></p>');


        //get data from server and put it into textfield
        $.post("/user/stats", function(data, status) {
            //data = JSON.parse(data);
            console.log(data);
            document.getElementById('usercenter_username').innerHTML=data.username;
            document.getElementById('usercenter_wins').innerHTML=data.wins;
            document.getElementById('usercenter_losses').innerHTML=data.losses;
            document.getElementById('usercenter_skilllevel').innerHTML=data.skill;
        });

    });

});


//show menu bar
function showMenuBar(login) {

    if (login == "logged in") {
        $('body').append('<div class="navbar_container"><ul>' +
                         '<li><a id="changeColorToWhite">White Background</a></li>'+
                         '<li><a id="changeColorToBlue">Blue Background</a></li>'+
                         '<li><a id="aboutUs" href="/aboutus.html">About Us</a></li>' +
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
    /*
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
    */
    
}

function userCenterGoBack() {
  window.history.back();
}
