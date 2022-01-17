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

        this.ball.body.bounce.x = 1;
        this.ball.body.bounce.y = 1;
        this.ball.body.collideWorldBounds = true;
        this.ball.body.onWorldBounds = true;


        
        let startGame = (data) => {
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
		    	/*
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

        this.physics.add.collider(this.controllerPlayer, this.ball, () => {
        	/*
			let sendData = JSON.stringify({
				x: this.ball.x,
				y: this.ball.y,
				velocityX: this.ball.body.velocity.x,
				velocityY: this.ball.body.velocity.y
			});
			socket.emit('sendPlayerCollision' + DEBUG, sendData);
			*/
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
        this.gameStateContainer = [];

        socket.on('getRollbackData', (d) => {
        	let data = JSON.parse(d);
        	this.remoteFrame = data.frame;
        	this.remoteFrameAdvantage = data.advantage;
        	if(this.gameStateContainer.length !== 0){
	        	let gameState = this.getGameStateByFrame(data.frame);
	        	if(gameState){
	        		let input = gameState.opponentInput;
		        	if(input.up !== data.up || input.down !== data.down){
		        		this.gameStateContainer[this.getIndexByFrame(gameState.frame)].opponentInput = {up: data.up, down: data.down};
		        		this.gameStateContainer[this.getIndexByFrame(gameState.frame)].predictionWrong = true;
		        	}
	        	}
        	}
        	//this.opponentInput = {up: data.up, down: data.down};
        });

        this.scene.pause();
        socket.emit('initiateGame');

    }

    update(){
    	// delay netcode update function
    	/*
        if (this.cursors.up.isDown && this.controllerPlayer.y > 50){
            this.controllerPlayer.y += -10;
        } else if (this.cursors.down.isDown && this.controllerPlayer.y < 350){
            this.controllerPlayer.y += 10;

        } else {
            //this.controllerPlayer.body.velocity.y = 0;
        }

		let data = JSON.stringify({ y: this.controllerPlayer.y
		});
		socket.emit('sendPlayerData' + DEBUG, data);
		*/


		// rollback netcode update function
		// need to reinitialize all variables to make it more determinestic? 

        // [Update Synchronization]
        let finalFrame = this.remoteFrame;
        if(this.remoteFrame > this.localFrame){
        	finalFrame = this.localFrame;
        }
    	//let found = false;
    	//let foundFrame;
    	/* Find the first frame where the predicted inputs do not match the
    	 * actual inputs
    	 */
    	let foundFrame = this.getFirstWrongPrediction();
    	if(foundFrame){
    		this.syncFrame = foundFrame - 1;
    	} else {
    		this.syncFrame = finalFrame;
    	}
        

        // [Rollback]
        if(this.localFrame > this.syncFrame && this.remoteFrame > this.syncFrame){
        	console.log(`rollback:${this.syncFrame}`);
        	// [restoreGameState]
        	this.restoreGameState(); //restore game to syncFrame
        	// select inputs from this.syncFrame + 1 from localFrame

        	// [Rollback update]
        	this.simulateInputs();
        	this.updateGame();
        	this.storeGameState();
        } 

		//[time synced]
		let localFrameAdvantage = this.localFrame - this.remoteFrame;
		let frameAdvantageDiff = localFrameAdvantage - this.remoteFrameAdvantage;
		if(localFrameAdvantage < MAX_ROLLBACK_FRAMES && frameAdvantageDiff <= FRAME_ADVANTAGE_LIMIT){
			this.localFrame++;
			console.log(`time synced ${this.syncFrame}`);
			let rollbackData = JSON.stringify({
				frame: this.localFrame,
				advantage: this.localFrame - this.remoteFrame,
				up: this.cursors.up.isDown,
				down: this.cursors.down.isDown
			});
			socket.emit('sendPlayerDataRollback', rollbackData);
			this.simulateInputs();
			this.updateGame();
			this.storeGameState();
		}

		console.log(`localFrame: ${this.localFrame} \n
			remoteFrame: ${this.remoteFrame} \n
			syncFrame: ${this.syncFrame}`);
		
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
    		if(gameState.predictionWrong)
    			return gameState.frame;
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
    	// restore game to this.syncFrame and remove unnessary junk from gameStateContainer
    	let count = 0;
    	for(let gameState of this.gameStateContainer){
    		if(gameState.frame < this.syncFrame)
    			count++;
    		else if(gameState.frame === this.syncFrame){
    			this.applyGameState(gameState);
    		}
    	}
    	for(let i = 0; i < count; i++){
    		this.gameStateContainer.shift();
    	}
    	console.log(`check: ${this.getGameStateByFrame(this.syncFrame)}`);
    }

    applyGameState(gameState){
    	this.localFrame = gameState.frame;
    	this.opponentInput = gameState.opponentInput;
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
    	// get opponent input of localFrame - 1 and apply it to localFrame
    	if(this.gameStateContainer.length > 0){
    		let gameState = this.getGameStateByFrame(this.localFrame - 1);
    		if(gameState){
    			this.opponentInput = gameState.opponentInput;
    		}
    	}

    }

    updateGame(){
    	// not correct 
    	// update: wait this might be correct
    	if(this.cursors.up.isDown && this.controllerPlayer.y > 50){
            this.controllerPlayer.y += -10;
        } else if(this.cursors.down.isDown && this.controllerPlayer.y < 350){
            this.controllerPlayer.y += 10;
        }

        if(this.opponentInput.up && this.opponentPlayer.y > 50){
        	this.opponentPlayer.y += -10;
        } else if(this.opponentInput.down && this.opponentPlayer.y < 350){
        	this.opponentPlayer.y += 10;
        }

    }

    storeGameState(){
    	this.gameStateContainer.push({
    		frame: this.localFrame,
    		playerInput: {up: this.cursors.up.isDown, down: this.cursors.down.isDown},
    		opponentInput: this.opponentInput,
    		ball: {
    			x: this.ball.x, y: this.ball.y, 
    			velocityX: this.ball.body.velocity.x,
    			velocityY: this.ball.body.velocity.y
    		},
    		player1Position: {x: this.player1.x, y: this.player1.y},
    		player2Position: {x: this.player2.x, y: this.player2.y},
    		predictionWrong: false
    	});

    	/*
    	if(this.gameStateContainer.length > MAX_ROLLBACK_FRAMES){
    		this.gameStateContainer.shift();
    	}*/
    }

}
