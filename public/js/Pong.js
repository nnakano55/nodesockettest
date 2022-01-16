const MAX_ROLLBACK_FRAMES = 10;
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
			let sendData = JSON.stringify({
				x: this.ball.x,
				y: this.ball.y,
				velocityX: this.ball.body.velocity.x,
				velocityY: this.ball.body.velocity.y
			});
			socket.emit('sendPlayerCollision' + DEBUG, sendData);
        }, null, this);
	
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

		socket.emit('initiateGame');


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
        	this.opponentInput = {up: data.up, down: data.down};
        });
        
    }

    update(){
    	// delay netcode update function
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

		// rollback netcode update function

        // [Update Synchronization]
        let finalFrame = this.remoteFrame;
        if(this.remoteFrame > this.localFrame){
        	let found = false;
        	let foundFrame;
        	/* Find the first frame where the predicted inputs do not match the
        	 * actual inputs
        	 */
        	if(found){
        		this.syncFrame = foundFrame - 1;
        	} else {
        		this.syncFrame = finalFrame;
        	}
        }

        // [Rollback]
        if(this.localFrame > this.syncFrame && this.remoteFrame > this.syncFrame){
        	// [restoreGameState]
        	// restoreGameState(); //restore game to syncFrame
        	// select inputs from this.syncFrame + 1 from localFrames

        	// [Rollback update]
        	// simulateInputs();
        	// updateGame();
        	// storeGameState();
        }

		//[time synced]
		let localFrameAdvantage = this.localFrame - this.remoteFrame;
		let frameAdvantageDiff = localFrameAdvantage - this.remoteFrameAdvantage;
		if(localFrameAdvantage < MAX_ROLLBACK_FRAMES && frameAdvantageDiff <= FRAME_ADVANTAGE_LIMIT){
			this.localFrame++;
			let rollbackData = JSON.stringify({
				frame: this.localFrame,
				advantage: this.localFrame - this.remoteFrame,
				up: this.cursors.up.isDown,
				down: this.cursors.down.isDown
			});
			// socket.emit('sendPlayerDataRollback', rollbackData);
			updateGame();
			storeGameState();
		}
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
    	// restore game to this.syncFrame 
    }

    simulateInputs(){
    	// get opponent input of syncFrame and apply it to syncFrame+1
    }

    updateGame(){

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
    		player2Position: {x: this.player2.x, y: this.player2.y}
    	});

    	if(this.gameStateContainer.length > MAX_ROLLBACK_FRAMES){
    		this.gameStateContainer.shift();
    	}
    }

}
