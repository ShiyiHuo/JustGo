// enumerations
var COLOR = {
    white: 2,
    black: 1,
    empty: 0
}

class Timer {

    constructor(blackTime, whiteTime, turn) {
        this.blackTime = blackTime;
        this.whiteTime = whiteTime;
        this.turn = turn;
        this.timerStart = new Date().getTime();
        this.timerStop = false;
    }

    changeTurn() {
        this.clientUpdateTime();
        if (this.turn == COLOR.black)
            this.turn = COLOR.white;
        else {
            this.turn = COLOR.black;
        }
    }

    authoritativeSetTime(blackTime,whiteTime,turn) {
        this.blackTime = blackTime;
        this.whiteTime = whiteTime;
        this.turn = turn;
        this.timerStart = new Date().getTime();
    }

    clientUpdateTime() {
        if (this.timerStop == false) {
            var timePassed = new Date().getTime() - this.timerStart;
            if (this.turn == COLOR.black) {
                this.blackTime = this.blackTime - timePassed;
                if (this.blackTime <= 0) {
                    this.blackTime = 0;
                }
            } else {
                this.whiteTime = this.whiteTime - timePassed;
                if (this.whiteTime <= 0) {
                    this.whiteTime = 0;
                }
            }
            this.timerStart = new Date().getTime();
        }
    }

    returnTime() {
        return {
            'blackTime': msToTime(this.blackTime),
            'whiteTime': msToTime(this.whiteTime)
        }
    }

    stopTimer() {
        this.timerStop = true;
    }

    restartTimer() {
        this.timerStop = false;
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
