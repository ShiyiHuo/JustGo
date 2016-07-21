"use strict"
class GameException extends Error {
    constructor(message) {
        super(message);
        console.error("GameException: " + message);
    }
}

class DoublePassException extends GameException {
    constructor() {
        super("Two passes occured in a row. The game is over.");
        console.error("Two passes occured in a row. The game is over.");
    }
}

module.exports = {
    GameException: GameException,
    DoublePassException: DoublePassException
}