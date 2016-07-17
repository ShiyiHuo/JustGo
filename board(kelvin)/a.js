var aspectratio = 15/10;


window.onload = function(){
	
	resizeToWindow();
	
	
}

window.onresize = function(){
	resizeToWindow();	
}

function resizeToWindow(){

	var gameWidth = window.innerWidth *(95/100); //5% margin
	var gameHeight = window.innerHeight *(95/100);
	if(gameWidth>gameHeight*aspectratio){ //ensure the gamespace has a fixed aspect ratio
		gameWidth=gameHeight*aspectratio;
	}else{gameHeight=gameWidth/aspectratio;}

	var gamespace = document.getElementById("gamespace");
	gamespace.style.width = gameWidth;
	gamespace.style.height = gameHeight;

	var boardCellWidth = gameWidth/aspectratio; //left half of gamespace
	var playerCellWidth = gameWidth - boardCellWidth; //right half
	
	var boardcell = document.getElementById("boardcell");
	boardcell.style.width = boardCellWidth;
	var playercell = document.getElementById("playercell");
	playercell.style.width = gameWidth-(boardCellWidth);
	var boardimg = document.getElementById("boardimg");
	boardimg.style.width = boardCellWidth*98/100;
	var boardMarginSize = (boardCellWidth*2/100)/2;
	boardimg.style.margin = ""+boardMarginSize+" "+boardMarginSize+" "+boardMarginSize+" "+boardMarginSize;

	print("Game space dimensions: width "+document.getElementById("gamespace").style.width+", height "+document.getElementById("gamespace").style.height);
	
	
	var playerObjectTop = document.getElementById("playertop");
	var playerObjectMid = document.getElementById("playermid");
	var playerObjectBot = document.getElementById("playerbot");
	
	playerObjectTop.style.width = playerCellWidth;
	playerObjectMid.style.width = playerCellWidth;
	playerObjectBot.style.width = playerCellWidth;

	//arbitrary heights for now, but sum of heights of player objects should equal the gamespace height 
	playerObjectTop.style.height = gameHeight/4; 
	playerObjectMid.style.height = gameHeight/2; 
	playerObjectBot.style.height = gameHeight/4; 
	
	//since font sizes do not scale yet, the text may force the fixed aspect ratio to break
	var playerStatTable = document.getElementById("player-stat-table");
	playerStatTable.style.width = "100%";
	playerStatTable.style.td.border = "1px solid black";
	for(i=0; i<playerStatTable.childNodes.length;i++){
	console.log(playerStatTable.childNodes[i]);}
	playerStatTable.style.borderColor = "#000000";
	
	
}

function F(){

}

function print(msg){
	var div = document.getElementById("debug");	
	div.innerHTML = ""+msg;
	}