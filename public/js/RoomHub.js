
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
		//this.load.html('text',`../assets/html/textinput.html`);
	}

	create(){
		
		let rect1 = this.add.circle(400, 200, 20, 0xFFFFFF);
		rect1.setIterations(0.25);
		
		this.tweens.add({
			targets: rect1,
			scaleX: 0,
			scaleY: 1,
			yoyo: true,
			repeat: -1,
			ease: 'Quad.easeInOut'
		});
		
		socket.emit('getRooms', (data) => {
			socket.emit('console', data);
			this.add.text(0, 0, data, {fontFamily:'Georgia, Times, serif', fontSize: 16});
			//socket.emit('console', JSON.stringify(data));	
		});
		let text = this.add.text(250, 200, 'Testing room', {fontFamily:'Georgia, Times, serif', fontSize: 16});
		text.setOrigin(0.5, 0.5);
		
		text.setInteractive().on('pointerdown', () => {
			this.rexUI.edit(text);
		});

		//let check = document.createElement('div');
		//check.innerHTML = '<h1>lmao</h1>;
		//check.style.color = '#FFFFFF'

		//let nameinput = this.add.dom(200, 200).createFromCache('text');
		//socket.emit('console', JSON.stringify(nameinput));
	}

	update(){

	}	

}
