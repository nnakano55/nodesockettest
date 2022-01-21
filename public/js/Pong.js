const MAX_ROLLBACK_FRAMES = 60;
const FRAME_ADVANTAGE_LIMIT = 10;
const INITIAL_FRAME = 0;

class Pong extends Phaser.Scene{
    
    constructor() {
        super('PongScene');
    }

    preload(){
        
    }

    create(){

        this.physics.world.setFPS(60);

        this.cursors = this.input.keyboard.createCursorKeys();
        
		this.controllerPlayer;
		this.opponentPlayer;
		
		this.player1 = this.add.rectangle(50, 200, 20, 100, 0xffffff);
        this.player2 = this.add.rectangle(750, 200, 20, 100, 0xffffff);
        this.ball = this.add.rectangle(400, 200, 20, 20, 0xffffff);
        this.score = {player1: 0, player2:0};

        this.physics.add.existing(this.player1);
        this.physics.add.existing(this.player2);
        this.physics.add.existing(this.ball);

        this.player1.body.setImmovable();
        this.player1.body.collideWorldBounds = true;
        this.player2.body.setImmovable();
        this.player2.body.collideWorldBounds = true;

        // arcade physics needs to be abandoned to make the game more deterministic\
        /*
         * 
         */
        this.ball.body.bounce.x = 1;
        this.ball.body.bounce.y = 1;
        this.ball.body.collideWorldBounds = true;
        this.ball.body.onWorldBounds = true;


        
        let startGame = (data) => {
        	/*
        	 * needs to be changed to only choose the direction of the ball and not the
        	 * velocity. The movement of the ball must be calculated manually in update()
        	 * in order keep the game's determinism in order for the rollback to work
        	 * properly
        	 */
        	console.log('startGamecalled');
			let dataObj = JSON.parse(data);
			this.ball.body.velocity.x = dataObj.velocityX;
			this.ball.body.velocity.y = dataObj.velocityY;
			this.scene.resume();
        };

        this.ball.body.world.on('worldbounds', (body, up, down, left, right) => {

	        if(!multiplayer){
		  		if(left){
	                this.score.player2++;
	                this.stopGame();
	                startGame(JSON.stringify({
	                	velocityX: this.getRandomVelocity(200),
	                	velocityY: this.getRandomVelocity(200)
	                }));
	            } else if(right) {
	                this.score.player1++
	                this.stopGame();
	                startGame(JSON.stringify({
	                	velocityX: this.getRandomVelocity(200),
	                	velocityY: this.getRandomVelocity(200)
	                }));
	            }
		    } else {		
		    	/* //keep this to think about how to re-initiate game after one player loses
				if(host && left){
					this.stopGame();
					this.score.player2++;
					socket.emit('sendPlayerLoss' + DEBUG);
					socket.emit('initiateGame' + DEBUG);
				} else if (!host && right){
					this.stopGame();
					this.score.player1++;
					socket.emit('sendPlayerLoss' + DEBUG);
					socket.emit('initiateGame' + DEBUG);	
				} 
				*/
		    }

        }); // End on - worldbounds 

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


        // future need to remove collider and manually calculate collision and bounce
        this.physics.add.collider(this.controllerPlayer, this.ball, () => {

        }, null, this);

        this.physics.add.collider(this.opponentPlayer, this.ball, () => {
        	// when opponent collided
        }, null, this);1
	
		socket.on('gameStart', startGame);

		socket.on('receiveOpponentLoss', () => {
			if(host){
				this.score.player1++;
			} else {
				this.score.player2++;
			}
			this.stopGame();
			socket.emit('initiateGame' + DEBUG);
		});

		socket.on('receiveOpponentData', (data) => {
			let dataObj = JSON.parse(data);
			this.opponentPlayer.y = dataObj.y;
		});
		
		socket.on('receiveOpponentCollision', (data) => {
			socket.emit('console', 'on recieve');
			let dataObj = JSON.parse(data);
			this.ball.x = dataObj.x;
			this.ball.y = dataObj.y;
			this.ball.body.velocity.x = dataObj.velocityX;
			this.ball.body.velocity.y = dataObj.velocityY;
			socket.emit('console', 'after recieve');
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
        this.gameStateContainer = new GameStateContainer();
        this.currentInput = {up: false, down: false};

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

		// rollback netcode update function
		if(this.localFrame < 200)
			console.log(`localFrame: ${this.localFrame} player: ${this.controllerPlayer.y} opponent: ${this.opponentPlayer.y}`);

		// Update Network Variables
		let updateRemoteFrame = this.remoteFrame;
		let updateRemoteFrameAdvantage = this.remoteFrameAdvantage;
		this.currentInput = {up: this.cursors.up.isDown, down: this.cursors.down.isDown};

        // [Update Synchronization]
        let finalFrame = updateRemoteFrame;
        if(updateRemoteFrame > this.localFrame){
        	finalFrame = this.localFrame;
        }
    	//let found = false;
    	//let foundFrame;
    	/* Find the first frame where the predicted inputs do not match the
    	 * actual inputs
    	 */
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
        	// select inputs from this.syncFrame + 1 from localFrame
        	// improvement can be made to simulte input
        	// [Rollback update]
        	this.simulateInputs();
        	this.updateGame();
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
    
    getIndexByFrame(frame){
    	for(let i = 0; i < this.gameStateContainer.length; i++){
    		if(this.gameStateContainer[i].frame == frame)
    			return i;
    	}
    }

    getGameStateByFrame(frame){
    	for(let gameState of this.gameStateContainer){
    		if(gameState.frame === frame)
    			return gameState;
    	}
    	return undefined;
    }

    getFirstWrongPrediction(){

    	for(let gameState of this.gameStateContainer){
    		if(gameState.predictionWrong){
    			return gameState.frame;
    		}
    	}

    	return undefined;
    }

    getRandomVelocity(orig){
		return Math.floor(Math.random() * 2) === 0 ? orig : orig * -1;
    }

    stopGame(){
    	this.ball.x = 400;
    	this.ball.y = 200;
    	this.ball.body.velocity.x = 0;
    	this.ball.body.velocity.y = 0;
    }

    restoreGameState(){

		if(this.gameStateContainer.has(this.syncFrame))
    		this.applyGameState(this.gameStateContainer.get(this.syncFrame));
    }

    applyGameState(gameState){
    	this.localFrame = gameState.frame;
    	this.currentInput.up = gameState.playerInput.up
    	this.currentInput.down = gameState.playerInput.down
    	this.opponentInput.up = gameState.opponentInput.up;
    	this.opponentInput.down = gameState.opponentInput.down;
    	this.ball.x = gameState.ball.x;
    	this.ball.y = gameState.ball.y;
    	this.ball.body.velocity.x = gameState.ball.velocityX;
    	this.ball.body.velocity.y = gameState.ball.velocityY;
    	this.player1.x = gameState.player1Position.x;
    	this.player1.y = gameState.player1Position.y;
    	this.player2.x = gameState.player2Position.x;
    	this.player2.y = gameState.player2Position.y;
    }

    simulateInputs(){

    	if(this.gameStateContainer.has(this.localFrame)){
    		let gameState = this.gameStateContainer.get(this.localFrame);
    		this.opponentInput.up = gameState.opponentInput.up;
			this.opponentInput.down = gameState.opponentInput.down;
			this.currentInput.up = this.cursors.up.isDown;
			this.currentInput.down = this.cursors.down.isDown;
    	}

    }

    updateGame(){

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

    }

    storeGameState(){

    	if(!this.gameStateContainer.has(this.localFrame)){

			this.gameStateContainer.set(this.localFrame, {
				frame: this.localFrame,
				playerInput: Object.assign({}, this.currentInput),
				opponentInput: Object.assign({}, this.opponentInput),
				ball: {
					x: this.ball.x, y: this.ball.y, 
					velocityX: this.ball.body.velocity.x,
					velocityY: this.ball.body.velocity.y
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
				velocityX: this.ball.body.velocity.x,
				velocityY: this.ball.body.velocity.y
			};
			gameState.player1Position = {x: this.player1.x, y: this.player1.y};
			gameState.player2Position = {x: this.player2.x, y: this.player2.y};
			gameState.predictionWrong = false;
			gameState.predicted = true;

			this.gameStateContainer.set(this.localFrame, gameState);

    	}
    }

}
