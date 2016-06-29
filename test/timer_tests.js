const timer = require('../game/timer.js');
const assert = require('assert');

/*
(function fiveseconds() {
    console.log("fivesecond test");
    var stopwatch = new timer.Timer(5000, onTimeout);
    var initial = new Date();

    stopwatch.start();
    function onTimeout() {
        console.log(new Date() - initial);
    }
})(); */

(function stopingThenStarting() {

    var onTimeout = function() {
        console.log(new Date() - first);
    }

    console.log('stoing then starting test');
    var stopwatch = new timer.Timer(5000, onTimeout);
    var first = new Date();
    stopwatch.start();

    setTimeout(function() {
        stopwatch.stop();
        console.log(stopwatch.getTime());

        setTimeout(function() {
            console.log(stopwatch.getTime());
            stopwatch.start();
        }, 2000)

    }, 2000);


})();








