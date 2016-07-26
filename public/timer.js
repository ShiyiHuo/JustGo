// enumerations
var COLOR = {
    white: 2,
    black: 1,
    empty: 0
}

class Timer {
    constructor(msRemaining) {
        this.msRemaining = msRemaining;
    }
    start() {
        this.endTime = Date.now() + this.msRemaining;
        this.timeoutID = setInterval((function() {
            this.msRemaining = this.endTime - Date.now(); 
            if (this.msRemaining <= 0) {
                clearInterval(this.timeoutID);
            }
        }).bind(this), 100);
    }

    stop() {
        clearInterval(this.timeoutID);
    }
}

class GameTimer {
    constructor(blackMsRemaining, whiteMsRemaining) {
        this.blackTimer = new Timer(blackMsRemaining);
        this.whiteTimer = new Timer(whiteMsRemaining); 
    }
    startBlackTimer() {
        this.blackTimer.start();
    }
    startWhiteTimer() {
        this.whiteTimer.start();
        $('#whiteTime').empty();
        $('#whiteTime').append(123);
    }
    stopBlackTimer() {
        this.blackTimer.stop();
        $('#blackTime').empty();
        $('#blackTime').append(1234);
    }
    stopWhiteTimer() {
        this.whiteTimer.stop();
    }
    syncTimesWithServer(blackMsRemaining, whiteMsRemaining) {
        this.blackTimer.msRemaining = blackMsRemaining;
        this.whiteTimer.msRemaining = whiteMsRemaining;
    }
    getWhiteTime() {
        return msToTime(this.whiteTimer.msRemaining);
    }
    getBlackTime() {
        return msToTime(this.blackTimer.msRemaining);
    }
}

function msToTime(duration) {
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds;
}
