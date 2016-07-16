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
    constructor(onBlackTimeout, onWhiteTimeout) {
        this.blackTimer = new Timer(constants.startingTimePool, onBlackTimeout);
        this.whiteTimer = new Timer(constants.startingTimePool, onWhiteTimeout); 
    }
    startBlackTimer() {
        this.blackTimer.start();
    }
    startWhiteTimer() {
        this.whiteTimer.start();
    }
    stopBlackTimer() {
        this.blackTimer.stop();
    }
    stopWhiteTimer() {
        this.whiteTimer.stop();
    }
    getWhiteTime() {
        return this.whiteTimer.msRemaining;
    }
    getBlackTime() {
        return this.blackTimer.msRemaining;
    }
}

module.exports = GameTimer;
