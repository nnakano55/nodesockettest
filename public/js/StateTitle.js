
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
    }

    update(){

    }

    changeState(){
        console.log(game);
    }

}

