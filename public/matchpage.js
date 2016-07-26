window.onload = function() {
    $.get('/game/matchstatus', function(data, status) {
        if (data.redirect)
            window.location = data.redirect;
    });
}

function longpoll() {
    $.ajax({
        method: 'GET',
        url: '/game/matchstatus',
        success: function(data) {
            if (data.redirect)
                window.location = data.redirect;
        },
        complete: longpoll,
        timeout: 30000
    });
}