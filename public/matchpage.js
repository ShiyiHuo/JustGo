window.onload = function() {
    $.get('/game/matchstatus', function(data, status) {
        if (data.redirect)
            window.location = data.redirect;
    });
}