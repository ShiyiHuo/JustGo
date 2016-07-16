"use strict";

const events = require('./events');
const constants = require('./game/constants')

class Timer {
    constructor(msRemaining, onTimeout) {
        this.msRemaining = msRemaining;
        this.onTimeout = onTimeout;
    }
    start() {
        this.endTime = Date.now() + this.msRemaining;
        this.timeoutID = setInterval(() => {
            this.msRemaining = this.endTime - Date.now(); 
            if (this.msRemaining <= 0) {
                this.onTimeout();
                clearInterval(this.timeoutID);
            }
        }, 100);
    }

    stop() {
        clearInterval(this.timeoutID);
    }
}

class GameTimer {
    constructor(messageBus, gameID) {
        this.blackTimer = new Timer(constants.startingTimePool, onTimeout);
        this.whiteTimer = new Timer(constants.startingTimePool, onTimeout); 
        this.messageBus = messageBus;
        function onTimeout(event) {
            this.messageBus.emit(events.gameOver(gameID)); // TODO will need to take parameters on who's winner
        }
    }
    startBlackTimer() {
        this.blackTimer.start();
    }
    startWhitetimer() {
        this.whiteTimer.start();
    }
    stopBlackTimer() {
        this.blackTimer.stop();
    }
    stopWhiteTimer() {
        this.whiteTimer.stop();
    }
    getTimes() {
        return { 
            whiteTimeLeft: this.whiteTimer.msRemaining, 
            blackTimeLeft: this.blackTimer.msRemaining 
        }
    }
}

module.exports = GameTimer;
