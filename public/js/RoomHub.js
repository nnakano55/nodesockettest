
class RoomHub extends Phaser.Scene {
	
	constructor(){
		super('RoomHubScene');	
	}

	preload(){
		this.load.scenePlugin({
			key: 'rexuiplugin',
			url: '/frameworks/rexuiplugin.min.js',
			sceneKey: 'rexUI'
		});
	
		this.load.plugin('rextexteditplugin', '/frameworks/rexuiplugin.min.js', true);
		this.load.html('text',`../assets/html/textinput.html`);
	}

	create(){
		
		socket.emit('getRooms', (data) => {
			socket.emit('console', data);
			this.add.text(0, 0, data, {fontFamily:'Georgia, Times, serif', fontSize: 16});
			//socket.emit('console', JSON.stringify(data));	
		});

		let htmlinput = this.add.dom(0, 0).createFromCache('text');
		htmlinput.setOrigin(0, 0);
		
		setRoomHubHTML(htmlinput, this);

	}

	update(){

	}	

}
