
// rollback constants
const MAX_ROLLBACK_FRAMES = 60;
const FRAME_ADVANTAGE_LIMIT = 60;
const INITIAL_FRAME = 0;

class Pong extends Phaser.Scene{
    
    constructor() {
        super('PongScene');
    }

    preload(){
        
    }

    create(){

    	// init world objects
        this.physics.world.setFPS(60);

        this.cursors = this.input.keyboard.createCursorKeys();
        
		this.controllerPlayer;
		this.opponentPlayer;
		
		this.player1 = this.add.rectangle(50, 200, 20, 100, 0xffffff);
        this.player2 = this.add.rectangle(750, 200, 20, 100, 0xffffff);
        this.ball = this.add.rectangle(400, 200, 20, 20, 0xffffff);
        this.score = {player1: 0, player2:0};

        this.ballSpeed = 10;
        this.ballVector = {x: 0, y: 0};

        // check which side the player will control
        if(multiplayer){
			if(host){
				this.controllerPlayer = this.player1;
				this.opponentPlayer = this.player2;
			} else {
				this.controllerPlayer = this.player2;
				this.opponentPlayer = this.player1;
			}
        } else {
            this.controllerPlayer = this.player1;
            this.ball.body.velocity.x = this.getRandomVelocity(200);
            this.ball.body.velocity.y = this.getRandomVelocity(200);
        }

		socket.on('gameStart', (data) => {

        	console.log('startGamecalled');
			let dataObj = JSON.parse(data);

			this.ballVector.x = dataObj.velocityX > 0 ? this.ballSpeed : -1 * this.ballSpeed;
			this.ballVector.y = dataObj.velocityY > 0 ? this.ballSpeed : -1 * this.ballSpeed;

			this.scene.resume();

        });

		socket.on('disconnected', () => {
			socket.emit('leaveRoom', () => {
				this.scene.start('SceneMain');	
			});
		});

        // set up for rollback netcode
        this.localFrame = INITIAL_FRAME;
        this.remoteFrame = INITIAL_FRAME;
        this.syncFrame = INITIAL_FRAME;
        this.remoteFrameAdvantage = 0;
        this.opponentInput = {up: false, down: false};
        this.currentInput = {up: false, down: false};
        this.gameStateContainer = new GameStateContainer();

        socket.on('getRollbackData', (d) => {
        	let data = JSON.parse(d);
        	this.remoteFrame = data.frame;
        	this.remoteFrameAdvantage = data.advantage;

        	this.gameStateContainer.checkOpponentInfo(data.frame, {
        		up: data.up,
        		down: data.down
        	});

        });

        this.scene.pause();
        socket.emit('initiateGame');

    }

    update(){

		// Update Network Variables
		let updateRemoteFrame = this.remoteFrame;
		let updateRemoteFrameAdvantage = this.remoteFrameAdvantage;
		this.currentInput = {up: this.cursors.up.isDown, down: this.cursors.down.isDown};

        // [Update Synchronization]
        let finalFrame = updateRemoteFrame;
        if(updateRemoteFrame > this.localFrame){
        	finalFrame = this.localFrame;
        }

    	let foundFrame = this.gameStateContainer.getFirstPredictedWrong(this.syncFrame);
    	if(foundFrame){
    		this.syncFrame = foundFrame - 1;
    	} else {
    		this.syncFrame = finalFrame;
  		}


        // [Rollback]
        if(this.localFrame > this.syncFrame && updateRemoteFrame > this.syncFrame){
        	// [restoreGameState]
        	this.restoreGameState(); //restore game to syncFrame
        	// improvement can be made to simulte input
        	// [Rollback update]
        	this.simulateInputs();
        	// it said do this on the pseudo code but that is a lie 
        	//this.updateGame(); 
        	this.storeGameState();
        	console.log('rollback!');
        } 

		//[time synced]
		let localFrameAdvantage = this.localFrame - updateRemoteFrame;
		let frameAdvantageDiff = localFrameAdvantage - updateRemoteFrameAdvantage;
		if(localFrameAdvantage < MAX_ROLLBACK_FRAMES && frameAdvantageDiff <= FRAME_ADVANTAGE_LIMIT){
			this.localFrame++;
			let rollbackData = JSON.stringify({
				frame: this.localFrame,
				advantage: this.localFrame - updateRemoteFrame,
				up: this.currentInput.up,
				down: this.currentInput.down
			});
			socket.emit('sendPlayerDataRollback' + DEBUG, rollbackData);
			this.simulateInputs();
			this.updateGame();
			this.storeGameState();
		}
		
    }

    getRandomVelocity(orig){
		return Math.floor(Math.random() * 2) === 0 ? orig : orig * -1;
    }

    restoreGameState(){
    	// finds the gamestate on syncFrame and applies it 
		if(this.gameStateContainer.has(this.syncFrame))
    		this.applyGameState(this.gameStateContainer.get(this.syncFrame));
    }

    applyGameState(gameState){
    	// recreates the gamestate saved on the gameState object
    	this.localFrame = gameState.frame;
    	this.currentInput.up = gameState.playerInput.up
    	this.currentInput.down = gameState.playerInput.down
    	this.opponentInput.up = gameState.opponentInput.up;
    	this.opponentInput.down = gameState.opponentInput.down;
    	this.ball.x = gameState.ball.x;
    	this.ball.y = gameState.ball.y;
    	this.ballVector.x = gameState.ball.vector.x;
    	this.ballVector.y = gameState.ball.vector.y;
    	this.player1.x = gameState.player1Position.x;
    	this.player1.y = gameState.player1Position.y;
    	this.player2.x = gameState.player2Position.x;
    	this.player2.y = gameState.player2Position.y;
    }

    simulateInputs(){
    	// gets the current player input and simulates the opponent input
    	this.currentInput.up = this.cursors.up.isDown;
		this.currentInput.down = this.cursors.down.isDown;
    	if(this.gameStateContainer.has(this.localFrame)){
    		let gameState = this.gameStateContainer.get(this.localFrame);
    		this.opponentInput.up = gameState.opponentInput.up;
			this.opponentInput.down = gameState.opponentInput.down;
    	} else if(this.gameStateContainer.has(this.syncFrame)) {
			let gameState = this.gameStateContainer.get(this.syncFrame);
    		this.opponentInput.up = gameState.opponentInput.up;
			this.opponentInput.down = gameState.opponentInput.down;    		
    	}
    }

    updateGame(){
    	// needs to check if the game is updated after the rollback or
    	// just a regular update when the time is synced ?
    	if(this.currentInput.up && this.controllerPlayer.y > 50){
            this.controllerPlayer.y += -10;
        }
        if(this.currentInput.down && this.controllerPlayer.y < 350){
            this.controllerPlayer.y += 10;
        }

        //console.log(this.opponentInput);
        if(this.opponentInput.up && this.opponentPlayer.y > 50){
        	this.opponentPlayer.y += -10;
        }
        if(this.opponentInput.down && this.opponentPlayer.y < 350){
        	this.opponentPlayer.y += 10;
        }

        /*[Calculate ball movement]
         *	calculate the movement of the ball
         *		also calculate the vector of the next movement
         */

        // move ball
        this.ball.x += this.ballVector.x;
        this.ball.y += this.ballVector.y;

        if(this.ball.x <= 0){
        	//player1 loses
        } else if(this.ballx >= 800) {
        	//player2 loses
        }

        // Player 1 collision box
        let leftPlayer1 = this.player1.x - 10;
        let rightPlayer1 = this.player1.x + 10;
        let topPlayer1 = this.player1.y - 50;
        let bottomPlayer1 = this.player1.y + 50;

        // Player 2 collision box
        let leftPlayer2 = this.player2.x - 10;
        let rightPlayer2 = this.player2.x + 10;
        let topPlayer2 = this.player2.y - 50;
        let bottomPlayer2 = this.player2.y + 50;

        // Ball collision box
        let leftBall = this.ball.x - 10;
        let rightBall = this.ball.x + 10;
        let topBall = this.ball.y - 10;
        let bottomBall = this.ball.y + 10;

        // Ball after simulated vector motion
        let leftBallVect = leftBall + this.ballVector.x;
        let rightBallVect = rightBall + this.ballVector.x;
        let topBallVect = topBall + this.ballVector.y;
        let bottomBallVect = bottomBall + this.ballVector.y;

        // Check future collision to calculate vector direction
        if( // player 1 & ball
        	leftBallVect < rightPlayer1 && rightBallVect > leftPlayer1 &&
        	topBallVect < bottomPlayer1 && bottomBallVect > topPlayer1
        ){
        //check future collision direction player1
        if(leftBall >= rightPlayer1 || rightBall <= leftPlayer1)
        	this.ballVector.x *= -1;
        if(topBall >= bottomPlayer1 || bottomBall <= topPlayer1)
        	this.ballVector.y *= -1;
        } else if ( // player 2 & ball
        	leftBallVect < rightPlayer2 && rightBallVect > leftPlayer2 &&
        	topBallVect < bottomPlayer2 && bottomBallVect > topPlayer2
        ){
        	//check future collision direction player2
         	if(leftBall >= rightPlayer2 || rightBall <= leftPlayer2)
         		this.ballVector.x *= -1;
         	if(topBall >= bottomPlayer2 || bottomBall <= topPlayer2)
         		this.ballVector.y *= -1;
        } else if(topBallVect < 0 || bottomBallVect > 400){
         	// collision with vertical world bound
         	this.ballVector.y *= -1;
        } else if(leftBallVect < 0 || rightBallVect > 800){
         	// placeholder for debugging, unnessesary to finialized game
         	this.ballVector.x *= -1;
        }

    }

    storeGameState(){
    	// update to work with new collision logic
    	if(!this.gameStateContainer.has(this.localFrame)){

			this.gameStateContainer.set(this.localFrame, {
				frame: this.localFrame,
				playerInput: Object.assign({}, this.currentInput),
				opponentInput: Object.assign({}, this.opponentInput),
				ball: {
					x: this.ball.x, y: this.ball.y, 
					vector: Object.assign({}, this.ballVector)
				},
				player1Position: {x: this.player1.x, y: this.player1.y},
				player2Position: {x: this.player2.x, y: this.player2.y},
				predictionWrong: false,
				predicted: true
			});

    	} else {

    		let gameState = this.gameStateContainer.get(this.localFrame);
    		gameState.playerInput = Object.assign({}, this.currentInput);
    		gameState.opponentInput = Object.assign({}, this.opponentInput);
			gameState.ball = {
				x: this.ball.x, y: this.ball.y, 
				vector: Object.assign({}, this.ballVector)
			};
			gameState.player1Position = {x: this.player1.x, y: this.player1.y};
			gameState.player2Position = {x: this.player2.x, y: this.player2.y};
			gameState.predictionWrong = false;
			gameState.predicted = true;

			this.gameStateContainer.set(this.localFrame, gameState);

    	}
    }

}
