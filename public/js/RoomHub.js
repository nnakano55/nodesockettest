
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
		try{
		/*
		<div id="input-form">
			<div id ="menu">Blah blah blah</div>
			<div id="contents">
				<div id="createRoom">
					<input id="textbox" type="text" name="name" placeholder="Full Name" />
					<input id="submit" type="button" name="name" value="create room" />
				</div>
			</div>
		</div>
		*/
		let htmlinput = this.add.dom(0, 0).createFromCache('text');
		htmlinput.setOrigin(0, 0);
		
		let html = setRoomHubHTML(htmlinput, this);

		/*
		socket.emit('console', JSON.stringify(nameinput));
		this.returnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

		this.returnKey.on('down', (event) => {
			let name = nameinput.getChildByID('textbox');
			socket.emit('console', name.toString());
			if(name.value != ''){
				socket.emit('console', name.value);
				name.value = '';
			}
			name.addEventListener('keydown', (e) => {
				socket.emit('console', `Keycode: ${e.keyCode}`);
			});
		});*/

		/*
		let input = nameinput.getChildByName('name');
     		socket.emit('console', JSON.stringify(input));
		input.addListener('keydown', (e) => {
			let code = e.keyCode;
			socket.emit('console', code);
			if(code == 13){
				
				socket.emit('console', input.value);
			}
		});
		*/

		} catch(error){
			socket.emit('console', `error: ${error.message}`);
		}

		//socket.emit('console', JSON.stringify(nameinput));
		
		/*
		let menu = this.rexUI.add.menu({
			x: 0,
			y: 0,
			width: 300,
			height: 300,
			orientation: 1,
			items: [],
			name: '',
			
			createBackgroundCallback: function(items){
			
			},

			createButtonCallback: function(item, index, items){
			
			},

			easeIn: 0,
			easeOut: 0

		});
		*/
	}

	update(){

	}	

}
