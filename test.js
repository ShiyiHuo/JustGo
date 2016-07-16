"use strict";
let x = 3

for (var i = 1; i < 3; i++) {
    console.log(x);
    if(true) {
        console.log(x);
        var v = 100;
    }
    console.log(v);
}