function aiTurn(id) {
    return 'AI TURN ' + id;
}

function gameOver(id) {
    return 'GAME OVER ' + id;
}

module.exports = { aiTurn: aiTurn, gameOver: gameOver };