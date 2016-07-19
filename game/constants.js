const empty = 0;
const black = 1;
const white = 2;
const clientColor = 3;

const startingTimePool =  60 * 15 * 1000; // in milliseconds
const startingByoyomiTime = 3 * 60 * 1000; 
const startingEpochs = 5;

module.exports = {
    clientColor: clientColor,
    white: white,
    black: black,
    empty: empty,
    startingTimePool: startingTimePool,
    startingByoyomiTime: startingByoyomiTime,
    startingEpochs: startingEpochs
}