const constants = require('./constants.js');

const threshold = 2;

function getScore(board, komi) {
	
	var blackScore = 0;
	var whiteScore = komi ? komi : 0;
	var influence = [];
	for (var i = 0; i < board.length; i++) {
		influence[i] = new Array(board.length).fill(0);
	}
    
	//this is bad because it defines every piece on board as an influence source
	for (var i = 0; i < board.length; i++) {
		for (var j = 0; j < board.length; j++) {
			if (board[i][j] !== constants.empty) {
				createInfluence(board[i][j], i, j, influence);    
			} 
		}
	}
	//----------
	
	//for each in list of influence sources create influence
	//-------

    for (var i = 0; i < influence.length; i++) {
        for (var j = 0; j < influence.length; j++) {
            if (influence[i][j] > threshold) {
                blackScore++;
            } else if (influence[i][j] < -threshold) {
                whiteScore++;
            }
        }
    }
    return { white: whiteScore, black: blackScore , influence : influence};
}
function createInfluence(color, i, j, influenceArr) {
	var multiplier = 0;
	if(color === constants.black) multiplier = 1;
	if(color === constants.white) multiplier = -1;
	
	for (var y = 0; y < influenceArr.length; y++) {
		for (var x = 0; x < influenceArr.length; x++) {
			var dist = Math.sqrt((x-i)*(x-i) + (y-j)*(y-j));
			influenceArr[x][y] += multiplier * influenceFunction(dist, influenceArr.length);
		}
	}
}

/**
*converts a distance to an influence value
*a larger distance translates to a smaller influence value
*/
function influenceFunction(dist, boardSize){
	//to be adjusted experimentally
	return 8 / Math.pow(2,dist);
}

function printBoardAndInf(board, influence){
	var str = "";
    for (var i = 0; i < board.length; i++) {
		str += "[ ";
        for (var j = 0; j < board.length; j++) {
			if(board[i][j]===constants.empty) str += 0;
			if(board[i][j]===constants.black) str += "B";
			if(board[i][j]===constants.white) str += "W";
			str += " ";
		}
		str += "] [ ";
		for (var j = 0; j < influence.length; j++) {
			var s = ""+(influence[i][j])+"    ";//padding to make the arrays align when printed
			str += s.substr(0,4);
			str += " ";
		}
		str += "] [ ";
		for (var j = 0; j < influence.length; j++) {
			if(Math.abs(influence[i][j]) > threshold){
				str += (influence[i][j]>0) ? "B" : "W";
			}
			else{ str += 0;}
			str += " ";
		}



		str += "]";
		str += "\n";
	}
	return str;
}



const W = constants.white;
const B = constants.black;







var brd = [[0, B, B, 0, 0],
			[B, W, W, 0, 0],
			[0, B, B, 0, 0],
			[0, 0, 0, 0, W],
			[0, 0, 0, W, W]];
var s = getScore(brd,0);

console.log("left: original board; mid: influence values; right:territory\n");
console.log(printBoardAndInf(brd,s.influence));
console.log("white,",s.white);
console.log("black,",s.black);
console.log("disputed,",(brd.length*brd.length-s.white-s.black));



var brd = [[0, 0, 0, 0, 0],
			[0, B, 0, 0, 0],
			[B, W, B, 0, 0],
			[W, W, B, 0, 0],
			[B, 0, W, 0, 0]];
var s = getScore(brd,0);

console.log("left: original board; mid: influence values; right:territory\n");
console.log(printBoardAndInf(brd,s.influence));
console.log("white,",s.white);
console.log("black,",s.black);
console.log("disputed,",(brd.length*brd.length-s.white-s.black));
