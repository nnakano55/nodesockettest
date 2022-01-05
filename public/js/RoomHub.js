
class RoomHub extends Phaser.Scene {
	
	constructor(){
		super('RoomHubScene');	
	}

	preload(){

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
			//this.add.text(0 ,0, JSON.stringify(data), {fontFamily:'Georgia, Times, serif'});
			//socket.emit('console', JSON.stringify(data));	
		});
		//this.add.text(0, 0, 'Testing room', {});
	}

	update(){

	}	

}
