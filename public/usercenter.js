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
        $.post("/user", function(data, status) {
            //data = JSON.parse(data);
            console.log(data);
            document.getElementById('usercenter_username').innerHTML=data.username;
            document.getElementById('usercenter_wins').innerHTML=data.wins;
            document.getElementById('usercenter_losses').innerHTML=data.losses;
        });

    });

});


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


        //use stack to go to previous page
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

function userCenterGoBack() {
  window.history.back();
}
