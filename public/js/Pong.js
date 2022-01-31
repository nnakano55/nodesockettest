/* PongScene
 *	pong scene that is designed for multiplayer with rollback netcode
 * 	01/29/2022 - currently the game is mostly done, there are a couple of functionalities
 *		that should be added to make the game more polished to be published
 * 	Current to-dos:
 *		-Make a UI that shows the current player score constantly throughout the match
 *		-DONE: Make an animation that shows at the begininng of the game and when either player
 *		scores a point
 *		-Set up a system that determines when the game ends and also make the entire game
 *		able to backtrack to the title screen whenever the player wants to 
 * 		-Replace portions of the code(the imported frameworks) with their respected cloud
 * 		URL
 *		-Make sure the game is very easily adapted to single player mode
 * 			* make it clear which portions of the code could be reused and think about
 *			how to replace it. Class inheritance is probably not a good idea
 *		-Make constants for game window size and such other variables
 *		-Make the gamestate information more compact?
 *			* create a function that converts gameStateContainer into a more compact data structure
 *			* create a funciton that converts the compact data into gameStateContainer
 * 
 */


// rollback constants
const MAX_ROLLBACK_FRAMES = 60;
const FRAME_ADVANTAGE_LIMIT = 60;
const INITIAL_FRAME = 0;
const BALL_SPEED = 10;


class Pong extends Phaser.Scene{
    
    constructor() {
        super('PongScene');
    }

    preload(){
        
    }

    create(){
    	// init world objects
        this.physics.world.setFPS(60);

        this.gameActive = false;
        this.cursors = this.input.keyboard.createCursorKeys();
        
		this.controllerPlayer;
		this.opponentPlayer;
		
		this.player1 = this.add.rectangle(50, 200, 20, 100, 0xffffff);
        this.player2 = this.add.rectangle(750, 200, 20, 100, 0xffffff);
        this.ball = this.add.rectangle(400, 200, 20, 20, 0xffffff);
        this.score = {player1: 0, player2:0};

        this.ballSpeed = BALL_SPEED;
        this.ballVector = {x: 0, y: 0};

        // set up for rollback netcode
        this.localFrame = INITIAL_FRAME;
        this.remoteFrame = INITIAL_FRAME;
        this.syncFrame = INITIAL_FRAME;
        this.remoteFrameAdvantage = 0;
        this.opponentInput = {up: false, down: false};
        this.currentInput = {up: false, down: false};
        this.gameStateContainer = new GameStateContainer();

        this.score1Text = this.add.text(
            config.width / 2 - 200, 
            config.height / 2, 
            `${this.score.player1}`,
            {fill:'#FFFFFF', fontSize: '128px', fontFamily:'Arial'}
        );
        this.score1Text.setOrigin(0.5);
        this.score1Text.alpha = 0.0;
        console.log(this.score1Text.x);

    	this.score2Text = this.add.text(
            config.width / 2 + 200, 
            config.height / 2, 
            `${this.score.player2}`,
            {fill:'#FFFFFF', fontSize: '128px', fontFamily:'Arial'}
        ).setOrigin(0.5);
    	this.score2Text.alpha = 0.0;

    	this.dashText = this.add.rectangle(config.width / 2, config.height / 2, 120, 25, 0xffffff);
    	this.dashText.alpha = 0.0;

    	this.goText = this.add.text(
            config.width / 2,
            config.height / 2, 
            `GO`,
            {fill:'#FFFFFF', fontSize: '400px', fontFamily:'Arial'}
        ).setOrigin(0.5);
        this.goText.alpha = 0.0;

        // check which side the player will control
		if(host){
			this.controllerPlayer = this.player1;
			this.opponentPlayer = this.player2;
		} else {
			this.controllerPlayer = this.player2;
			this.opponentPlayer = this.player1;
		}

		// init socket emitters
		socket.on('gameStart', (data) => {

        	console.log('startGamecalled');
			let dataObj = JSON.parse(data);

			this.ballVector.x = dataObj.velocityX > 0 ? this.ballSpeed : -1 * this.ballSpeed;
			this.ballVector.y = dataObj.velocityY > 0 ? this.ballSpeed : -1 * this.ballSpeed;
			this.gameActive = true;
        });

		socket.on('disconnected', () => {
			socket.emit('leaveRoom', () => {
				this.scene.start('SceneMain');	
			});
		});

        socket.on('getRollbackData', (d) => {
        	let data = JSON.parse(d);
        	this.remoteFrame = data.frame;
        	this.remoteFrameAdvantage = data.advantage;

        	this.gameStateContainer.checkOpponentInfo(data.frame, {
        		up: data.up,
        		down: data.down
        	});

        });

        socket.on('getOpponentLoss', () => {
        	// [update score]
        	this.gameActive = false;
        	this.resetGameState();
    		this.gameStateContainer.clear();
    		this.playerWins();
    		console.log(this.score);
    		this.scoreTweenAnimate();
        });

   		// stop scene until the game is properly initiated
   		this.scoreTweenAnimate();
    	
    }

    scoreTweenAnimate(){
    	console.log('called tween animation');
    	let _this = this; // to reference this class inside the tween object
    	this.score1Text.setText(`${this.score.player1}`);
    	console.log(this.score1Text.x);
    	this.score2Text.setText(`${this.score.player2}`);
		this.score1Text.alpha = 1.0;
		this.score2Text.alpha = 1.0;
		this.dashText.alpha = 1.0;

	    const origX1 = this.score1Text.x;
	    const origX2 = this.score2Text.x;
	    const hypotenuse1 = this.score1Text.x - config.width/2;
	    const hypotenuse2 = this.score2Text.x - config.width/2;
	    let spinTween = this.tweens.addCounter({
	        from: 0,
	        to: 4 * Math.PI,
	        repeat: 0,
	       	ease: 'Quart.easeInOut',
	        onUpdate: (tween) => {
	            //  tween.getValue = range between 0 and 360
	            let angle = tween.getValue() * (180 / Math.PI);
	            _this.score1Text.angle = angle;
	            _this.score2Text.angle = angle;
	            _this.dashText.angle = angle * -1;
	            let adjacent = hypotenuse1 * Math.cos(tween.getValue());
	            let opposite = hypotenuse1 * Math.sin(tween.getValue());
	            _this.score1Text.x = config.width/2 + adjacent;
	            _this.score1Text.y = config.height/2 + opposite;
	            adjacent = hypotenuse2 * Math.cos(tween.getValue());
	            opposite = hypotenuse2 * Math.sin(tween.getValue());
	            _this.score2Text.x = config.width/2 + adjacent;
	            _this.score2Text.y = config.height/2 + opposite;
	        },
	        onComplete: () => {
	        	let alphaTween = _this.tweens.add({
	        		targets: [_this.score1Text, _this.score2Text, _this.dashText],
	        		alpha: 0.0,
	        		duration: 200,
	        		repeat: 0,
	        		onComplete: () => {
	        			_this.score1Text.angle = 0;
	        			_this.score1Text.x = origX1;
			            _this.score2Text.angle = 0;
			            _this.score2Text.x = origX2;
			            _this.dashText.angle = 0;
			        	_this.goText.alpha = 1.0;
	        			_this.tweens.add({
	        				targets: _this.goText,
	        				alpha: 0.0,
	        				delay: 300,
	        				duration: 200,
	        				repeat: 0,
	        				onComplete: () => {socket.emit('initiateGame');}
	        			});
	        		}
	        	});
	        }
    	});

    }

    update(){
    	if(!this.gameActive)
    		return;
    	console.log(this.localFrame);
		// Update Network Variables
		let updateRemoteFrame = this.remoteFrame;
		let updateRemoteFrameAdvantage = this.remoteFrameAdvantage;
		this.currentInput = {up: this.cursors.up.isDown, down: this.cursors.down.isDown};

        // [Update Synchronization]
        let finalFrame = updateRemoteFrame;
        if(updateRemoteFrame > this.localFrame){
        	finalFrame = this.localFrame;
        }

        // [Set sync frame]
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
        	//this.updateGame(); // don't do this, I don't know why the pseudocode wants me to do this
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
			socket.emit('sendPlayerDataRollback', rollbackData);
			this.simulateInputs();
			this.updateGame();
			this.storeGameState();
		}
		
    }

    getRandomVelocity(orig){
		return Math.floor(Math.random() * 2) === 0 ? orig : orig * -1;
    }


    resetGameState(){
    	let gameState = {
    		frame: INITIAL_FRAME,
    		playerInput: {up: false, down: false},
    		opponentInput: {up: false, down: false},
    		ball: {
    			x: 400, y: 200,
    			vector: {x: 0, y: 0}
    		},
    		player1Position: {x: 50, y: 200},
    		player2Position: {x: 750, y: 200}
    	}
    	this.localFrame = INITIAL_FRAME;
        this.remoteFrame = INITIAL_FRAME;
        this.syncFrame = INITIAL_FRAME;
        this.remoteFrameAdvantage = 0;
    	this.applyGameState(gameState);
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
    	// can be improved upon by using more inputs from previous frames
    	// to create a smarter algorithm to similate opponent inputs
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
         	// this.ballVector.x *= -1;
        }

        if(this.checkPlayerLost()){
        	this.gameActive = false;
    		this.resetGameState();
    		this.gameStateContainer.clear();
    		socket.emit('sendPlayerLoss');
    		this.playerLoses();
    		this.scoreTweenAnimate();
        }

    }

    playerWins(){
    	if(host){
    		this.score.player1++;
    	} else {
    		this.score.player2++;
    	}	
    }

    playerLoses(){
    	if(host){
    		this.score.player2++;
    	} else {
    		this.score.player1++;
    	}	
    }

    checkPlayerLost(){
    	if(host){
    		if(this.ball.x <= 0){
        		return true;
	        } 
	        return false;
    	} 

    	if(this.ball.x >= 800){
    		return true;
    	}
    	return false;
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
