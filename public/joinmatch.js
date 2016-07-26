window.onload = function() {
    $.get('/user/multiplayergames', function(data, status) {

        for (var game of data) {
            var button = $('<button/>', {
            text: 'size: ' + game.size + ' username: ' + game.username,
            id: game.id,
            click: function() {
                $.post('/user/multiplayergames', {gameID: game.id} , function(data, status) {
                    window.location = '/gamepage.html';
                });
            }
            });
            $('body').append(button);
            var BR = $('<br>');
            $('body').append(BR);
        }
    });
}
