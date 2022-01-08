
class StateTitle extends Phaser.Scene{
    
    constructor() {
        super('SceneMain');
    }

    preload(){
        
    }

    create(){
       

        let t = this.add.text(
            30, 
            config.height / 2, 
            "This is StateTitle. \nClick to change to StateMain",
            {fill:'#FFFFFF', fontSize: '32px'}
        );
        t.setInteractive();
        t.name = 'testnamenfjdasfjdkas';


        this.input.on('gameobjectdown', (event, obj) => {
            
            if(obj.name === 'testnamenfjdasfjdkas'){
                
		this.scene.start('RoomHubScene');
            }
        }, this);

        this.input.on('pointerover', (event, objs) => {
            if(objs[0].name === 'testnamenfjdasfjdkas'){
                objs[0].setTint(0xff0000);
        	socket.emit('console', 'hovering');
            }

        });

        this.input.on('pointerout', (event, objs) => {
            if(objs[0].name === 'testnamenfjdasfjdkas'){
                objs[0].clearTint();
            }
        });

	this.input.on('keydown', (event) => {
		socket.emit('console', JSON.stringify(event));
	});
    }

    update(){

    }

    changeState(){
        console.log(game);
    }

}

