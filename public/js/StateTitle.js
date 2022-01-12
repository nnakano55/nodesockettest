
class StateTitle extends Phaser.Scene{
    
    constructor() {
        super('SceneMain');
    }

    preload(){
        this.load.scenePlugin({
            key: 'rexuiplugin',
            url: '/frameworks/rexuiplugin.min.js',
            sceneKey: 'rexUI'
        });
    
        this.load.plugin('rextexteditplugin', '/frameworks/rexuiplugin.min.js', true);
        this.load.html('title',`../assets/html/title.html`);
    }

    create(){
        let htmlinput = this.add.dom(400, 200).createFromCache('title');
        let singlePlayerButton = htmlinput.getChildByID("singlePlayerContainer")
            .querySelector('#singlePlayerButton');
        let multiPlayerButton = htmlinput.getChildByID("multiPlayerContainer")
            .querySelector('#multiPlayerButton');
            
        singlePlayerButton.addEventListener('click', () => {
            this.scene.start('PongScene');
        });
        
        multiPlayerButton.addEventListener('click', () => {
            this.scene.start('RoomHubScene');
        });


        /*
        this.tweens.add({
            targets: htmlinput,
            x: 200,
            yoyo: true,
            repeat: -1,
            ease: 'Quad.easeInOut'
        });*/

       /*try{
        
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
	} catch(error){
		socket.emit('console', `error: ${error.message}`);
	}*/
    }

    update(){

    }

    changeState(){
        console.log(game);
    }

}

