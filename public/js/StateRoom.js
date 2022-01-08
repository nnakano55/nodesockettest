

class StateRoom extends Phaser.Scene{
    
	constructor() {
		super('RoomState');
	}

	preload(){
        this.load.scenePlugin({
			key: 'rexuiplugin',
			url: '/frameworks/rexuiplugin.min.js',
			sceneKey: 'rexUI'
		});
	
		this.load.plugin('rextexteditplugin', '/frameworks/rexuiplugin.min.js', true);
		this.load.html('room',`../assets/html/room.html`);
   	}

    create(){
		let room = this.add.dom(0,0).createFromCache('room');
		room.setOrigin(0, 0);
		socket.emit('getCurrentRoom', (data) => {
			console.log('getCurrentRoom Called!');
			console.log(JSON.parse(data));
			socket.emit('console', data);
		});

		socket.on('roomUpdated', () => {
			console.log('roomUpdated');
			socket.emit('getCurrentRoom', (data) => {
				console.log('getCurrentRoom Called!');
				console.log(JSON.parse(data));
				socket.emit('console', data);
			});
		});
	}

	update(){

	}
}
