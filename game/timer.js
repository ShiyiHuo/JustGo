"use strict"

class Timer {

    constructor(startingTime, onTimeout) {
        this.__id;
        this.__time = startingTime;
        this.__onTimeout = onTimeout;
    }

    start() {
        this.__id = setInterval(() => {
            this.__time -= 100;
            if (this.__time <= 0) {
                this.__onTimeout();
                clearInterval(this.__id);
            }
        }, 100);
    }

    getTime() {
        return this.__time;
    }

    stop() {
        clearInterval(this.__id);
    }
}

module.exports = {
    Timer: Timer
}
