

class StateRoom extends Phaser.Scene{
    
	constructor() {
		super('RoomState');
		    	
		this.load.scenePlugin({
			key: 'rexuiplugin',
			url: '/frameworks/rexuiplugin.min.js',
			sceneKey: 'rexUI'
		});
	
		this.load.plugin('rextexteditplugin', '/frameworks/rexuiplugin.min.js', true);
		this.load.html('room',`../assets/html/room.html`);
	}

	preload(){
        
   	}

    	create(){
		this.add.dom(0,0).createFromCache('room');
	}

	update(){

	}
}
