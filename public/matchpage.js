window.onload = function() {
    longpoll();
}

var longpollActive = true;
function longpoll() {
    $.ajax({
        method: 'GET',
        url: '/game/matchstatus',
        success: function(data) {
            if (data.redirect) {
                longpollActive = false;
                window.location = data.redirect;
            }
        },
        complete: function(xhr, status) {
                        if (status == "error" && longpollActive)
                                window.alert("Error. Server disconnected")
                        else longpoll();
                },
        timeout: 30000
    });
}