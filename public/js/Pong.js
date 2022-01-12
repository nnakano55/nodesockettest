
class Pong extends Phaser.Scene{
    
    constructor() {
        super('PongScene');
    }

    preload(){
        
    }

    create(){

        this.physics.world.setFPS(60);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.player = this.add.rectangle(50, 200, 20, 100, 0xffffff);
        this.opponent = this.add.rectangle(750, 200, 20, 100, 0xffffff);
        this.ball = this.add.rectangle(400, 200, 20, 20, 0xffffff);
        this.score;


        this.physics.add.existing(this.player);
        this.physics.add.existing(this.opponent);
        this.physics.add.existing(this.ball);

        this.player.body.setImmovable();
        this.player.body.collideWorldBounds = true;
        this.opponent.body.setImmovable();
        this.opponent.body.collideWorldBounds = true;

        this.physics.add.collider(this.player, this.ball, () => {
            console.log('collided!')
             this.ball.body.velocity.x += 50;
             this.ball.body.velocity.y += 50;
        }, null, this);
        this.physics.add.collider(this.opponent, this.ball, () => {
            console.log('collided!')
             this.ball.body.velocity.x += 50;
             this.ball.body.velocity.y += 50;
        }, null, this);
        
        console.log(this.player);

        this.ball.body.bounce.x = 1;
        this.ball.body.bounce.y = 1;
        this.ball.body.collideWorldBounds = true;
        this.ball.body.velocity.x = 200;
        this.ball.body.velocity.y = 200;
        this.ball.body.onWorldBounds = true;
        
        this.ball.body.world.on('worldbounds', (body, up, down, left, right) => {
            if(left){
                console.log("player 2 wins");
            } else if(right) {
                console.log("player 1 wins");
            }
        });

        if(multiplayer){

        } else {
            
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
         if (this.cursors.up.isDown){
            this.player.body.velocity.y = -600;
        } else if (this.cursors.down.isDown){
            this.player.body.velocity.y = 600;

        } else {
            this.player.body.velocity.y = 0;
        }

    }

}