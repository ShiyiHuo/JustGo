"use strict";
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
            console.log(this.msRemaining);
        }, 100);
    }

    stop() {
        clearInterval(this.timeoutID);
    }
}

module.exports = Timer;
