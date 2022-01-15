
class Pong extends Phaser.Scene{
    
    constructor() {
        super('PongScene');
    }

    preload(){
        
    }

    create(){

	try{

        this.physics.world.setFPS(60);

        this.cursors = this.input.keyboard.createCursorKeys();
        
		this.controllerPlayer;
		this.opponentPlayer;
		
		this.player1 = this.add.rectangle(50, 200, 20, 100, 0xffffff);
        this.player2 = this.add.rectangle(750, 200, 20, 100, 0xffffff);
        this.ball = this.add.rectangle(400, 200, 20, 20, 0xffffff);
        this.score;


        this.physics.add.existing(this.player1);
        this.physics.add.existing(this.player2);
        this.physics.add.existing(this.ball);

        this.player1.body.setImmovable();
        this.player1.body.collideWorldBounds = true;
        this.player2.body.setImmovable();
        this.player2.body.collideWorldBounds = true;
	/*
        this.physics.add.collider(this.player1, this.ball, () => {
            console.log('collided!');
		
        }, null, this);
        this.physics.add.collider(this.player2, this.ball, () => {
            console.log('collided!');
		
	}, null, this);
        */
        console.log(this.player1);

        this.ball.body.bounce.x = 1;
        this.ball.body.bounce.y = 1;
        this.ball.body.collideWorldBounds = true;
        this.ball.body.onWorldBounds = true;
        
        this.ball.body.world.on('worldbounds', (body, up, down, left, right) => {
            if(!multiplayer){
	  	if(left){
                	console.log("player 2 wins");
            	} else if(right) {
                	console.log("player 1 wins");
            	}
	    } else {
		if((host && left) || (!host && right)){
			
			socket.emit('sendPlayerLoss');
			
		} 
	    }
        });

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
		let sendData =JSON.stringify({
			x: this.ball.x,
			y: this.ball.y,
			velocityX: this.ball.body.velocity.x,
			velocityY: this.ball.body.velocity.y
		});
		socket.emit('sendPlayerCollision', sendData);
        }, null, this);
	
		socket.on('gameStart', (data) => {
			let dataObj = JSON.parse(data);
			this.ball.body.velocity.x = dataObj.velocityX;
			this.ball.body.velocity.y = dataObj.velocityY;
		});

		socket.on('receiveOpponentLoss', () => {
			// do whatever when opponentLost
			//
			console.log('I won!');
		});

		socket.on('receiveOpponentData', (data) => {
			let dataObj = JSON.parse(data);
			this.opponentPlayer.y = dataObj.y;
			
			/*this.tweens.add({
				targets: opponentPlayer,
				y: dataObj.y,
				yoyo: false,
				repeat: 1,
				ease: 'Quad.easeInOut'
			});*/
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
	} catch(err){
		socket.emit('console', `error: ${err.message}`);
	}
    }

    update(){
        /*
        if (cursors.left.isDown)
        {
            player.setVelocityX(-160);

            player.anims.play('left', true);
        }
        else if (cursors.right.isDown)
        {
            player.setVelocityX(160);

            player.anims.play('right', true);
        }
        else
        {
            player.setVelocityX(0);

            player.anims.play('turn');
        }

        if (cursors.up.isDown && player.body.touching.down)
        {
            player.setVelocityY(-330);
        }
        */

	try{
        if (this.cursors.up.isDown){
            this.controllerPlayer.body.velocity.y = -600;
        } else if (this.cursors.down.isDown){
            this.controllerPlayer.body.velocity.y = 600;

        } else {
            this.controllerPlayer.body.velocity.y = 0;
        }
	
	
	let data = JSON.stringify({ y: this.controllerPlayer.y
	});
	
	//let data = JSON.stringidy({y : 600});

	socket.emit('sendPlayerData', data);
	} catch(err){
		socket.emit('console', `error: ${err.message}`);
	}
    }
    
    getRandomVelocity(orig){
	return Math.floor(Math.random() * 2) === 0 ? orig : orig * -1;
    }

}
