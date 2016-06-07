/**
*last update: June 7
*
*Changes:
*more documentation
*improved definitions of dependent classes
*merged Stone and Army classes
*implemented Replay
*/

public class GameHandler{
	
	//class variables
	Object app //the web app which players directly interact with (user interface)
			//includes display() and prompt() functions
	
	enum A=1,B=2,C=3,D=4,E=5, ... S=19 //horizontal grid lines
	
	int[][] board //values of 0=empty, -1=white, 1=black
	int currentTurn //-1=white, 1=black, 0 is invalid
	
	Army[][] armiesInPlay
		//to find references to Army objects given a position
		//can be either null or an Army reference
	
	float score
	float komi
	final float KOMI_PRESET = 5.5
	
	boolean previousPass = false
	boolean gameOver

	int[][] prevBoard //for implementation of ko rule
	List<Point> moveHistory //for replay; must be doubly-linked, or random-access

	Player black
	Player white
	
	Timer btimer
	Timer wtimer
	
	
	
	
	public function newGame(Player A, Player B, int h, int w, int maintime, int byotime, int byoperiods){
		
		int height = h
		int width = w
		if !legalBoard {
			app.prompt(height, width)
		}
		
		createBoard(h,w)
		
		btimer.maintime = maintime
		btimer.byotime = byotime
		btimer.byoperiods = byoperiods
		wtimer.maintime = maintime
		wtimer.byotime = byotime
		wtimer.byoperiods = byoperiods
		
		int skillDiff = A.compareTo(B)
		catch(Exception){//if player does not exist
			app.display("player account not set, scores will not be saved")
			skillDiff = 0
		}

		if(skillDiff < 0){//A is more skilled
			black = B
			white = A			
		}else {//B is more skilled or equal
			black = A
			white = B
		}
		setHandicap(Math.abs(skillDiff))
		
		app.display("Game Start")
		btimer.start()
	}


	function legalBoard(int h, int w){
		if h!=w return false //not square
		if h%2==0 return false //even number of lines
		return true //passes test
	}
	
	function createBoard(int h, int w){
		board = new int[h][w]
		for each int h,w in board{
			board[h][w] = 0
		}		
	}
	
	function setHandicap(int handicap){//handicap must be between 0 and 9
		//see http://senseis.xmp.net/?HandicapPlacement
		switch(handicap)
			case 0{komi = KOMI_PRESET}
			case 1{komi = 0.5}
			case 2{}//up to implementation: either free or fixed handicap
			...
			case 9{}
	}
	
	public function move(int y, int x){//y is vertical position x is horizontal position
		if !legalMove(y,x) throw new Exception //(to be caught by user interface app)
		
		board[y][x] = currentTurn //sets board position to current colour
		app.displayMove(y,x) //visually show move
		
		List<Army> neighbours = new List
			neighbours.add(armiesInPlay[y-1][x])
			neighbours.add(armiesInPlay[y][x-1])
			neighbours.add(armiesInPlay[y+1][x])
			neighbours.add(armiesInPlay[y][x+1])
			//check that the pointer does not go off the board
			//possibly fewer than 4 neighbours

			
		for each Army A in neighbours{
			if A.colour == -1 * currentTurn //opposite colour
				//capture
			if A.colour == currentTurn //same colour
				//union
		}
		previousPass = false
		nextTurn()
	}
	
	
	function legalMove(int y, int x){
		if board[y][x] != 0 return false //already occupied
		//more complex rules:
		//false if violates ko rules
		//false if suicide UNLESS the move captures at least 1 enemy
	}
	
	function nextTurn(){
		if (currentTurn == 1){
			black.timer.stop()
			white.timer.start()
		}
		else{
			white.timer.stop()
			black.timer.start()
		}
		currentTurn *= -1
		app.nextTurn() //this class determines the invisible logic of the game, so
					//the user interface needs to be notified when the next turn occurs
	}
	
	public function pass(){
		if(previousPass == true) gameOver()
		previousPass = true
		nextTurn()
	}
	
	function gameOver(){
		black.timer.stop()
		white.timer.stop()
		
		int result = score
		//this player score modification should probably be moved to the user interface class or at least be visible there
		if (result > 0) {
			black.wins++
			white.losses++
		}else if (result < 0){
			black.losses++
			white.losses++
		}
			
	}//calls score()
	
	public function score(){
		//return 1 if black victory, -1 if white victory
	}//may be called manually even if game if not over
	
	public function replay(){
		//implementation to be decided: separate mode for replay?
		//should only be allowed to be called if game is over
	}
	public function replayForward(){
		moveHistory = moveHistory.next()
		board[moveHistory.move.y][moveHistory.move.x] = moveHistory.colour //places the played piece on board
		for each Point p in moveHistory.captured{
			board[p.y][p.x] = 0 //remove captured
		}
	}
	public function replayBack(){
		board[moveHistory.move.y][moveHistory.move.x] = 0 //remove the played piece
		for each Point p in moveHistory.captured{
			board[p.y][p.x] = (-1)*moveHistory.colour //return captured pieces
		moveHistory = moveHistory.prev()
	}
	
	
	
	
}

/**
*
*/
class Army{
	int colour
	List<Point> positions
	
	function getLiberties()//return int
	function union(Army A)
	
}

/**
*used to save replays
*a new Move object shall be created at the end of every legal move
*	unless the move is a pass
*/
class Move{
	int colour
	Point move
	List<Point> captured
}

/**
*used in conjunction with the database
*used to compare skill handicap and to save score
*/
public class Player{
	private String name //must be uniquely identifiable
	private int wins
	private int losses
	
	public function getName(){}
	
	public function compareTo(Player p){
		//return int between -9 and +9 based on skill difference
	}
	public function updateWinLoss(int score){
		//score should be {-1, 0, 1} for loss/tie/win
		//score is not related to GameHandler.score which counts territory
	}
}

/**
*counts gameplay time
*>>>>consider moving this class to Client side instead<<<<
*Time on Client must be updated once per second
*Client should visually or aurally indicate when time is running out
*/
public class Timer{
	private float maintime
	private float byotime
	private int byoperiods
	
	constructor Timer(maintime, byotime, byoperiods){
		//check that input is valid otherwise throw error
	}
	
	public function start()
	public function stop()
	//if timer counts to zero, force gameOver
}