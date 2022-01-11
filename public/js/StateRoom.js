

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

		let roomTop = room.getChildByID('roomTop');
		this.roomName = roomTop.querySelector('#roomName');

		let roomState = room.getChildByID('roomState');
		this.player1Name = roomState.querySelector('#player1Name');
		this.player2Name = roomState.querySelector('#player2Name');
		this.player1Check = roomState.querySelector('#player1Check');
		this.player2Check = roomState.querySelector('#player2Check');

		let stateConfig = room.getChildByID('stateConfig');
		this.leaveRoom = stateConfig.querySelector('#leaveButton');
		this.startRoom = stateConfig.querySelector('#startButton');

		this.host = false;

		room.setOrigin(0, 0);
		
		this.leaveRoom.addEventListener('click', () => {
			socket.emit('leaveRoom', () => {
				console.log('room left!');
				this.scene.start('RoomHubScene');
			})
		});

		this.startRoom.addEventListener('click', () => {
			if(this.player1Check.checked && this.player2Check.checked){
				// start game!
				console.log("start game!");
			} else {
				console.log("not ready");
			}
		});

		this.player1Check.addEventListener('click', () => {
			let opponentId = this.getOpponentId();
			if(opponentId)
				socket.emit('checkboxChanged', opponentId, this.player1Check.checked);
		});

		this.player2Check.addEventListener('click', () => {

			let opponentId = this.getOpponentId();
			if(opponentId)
				socket.emit('checkboxChanged', opponentId, this.player2Check.checked);
		});

		socket.on('roomUpdated', () => {
			console.log('roomUpdated');	

			socket.emit('getCurrentRoom', (success, data) => {
				if(success){
					this.refreshRoom(JSON.parse(data));
				
					let opponentId = this.getOpponentId();
					if(opponentId && opponentId != 'Slot'){
						if(this.host){
							socket.emit('checkboxChanged', opponentId, this.player1Check.checked);
						} else {
							socket.emit('checkboxChanged', opponentId, this.player2Check.checked);
						}
					}

				}
				else
					console.log('failed to get current room');
			});
			


		});

		socket.on('opponentCheckUpdated', (state) => {
			console.log('checkupdated called');
			if(this.host){
				this.player2Check.checked = state;
			} else {	
				this.player1Check.checked = state;
			}
		});

		socket.on('opponentEnteredRoom', () => {
			let opponentId = this.getOpponentId();
			if(opponentId && opponentId != 'Slot'){
				if(this.host){
					socket.emit('checkboxChanged', opponentId, this.player1Check.checked);
				} else {
					socket.emit('checkboxChanged', opponentId, this.player2Check.checked);
				}
			}
		});

		socket.emit('getCurrentRoom', (success, data) => {
			
			if(success){
				this.refreshRoom(JSON.parse(data));
				let opponentId = this.getOpponentId();
				if(opponentId && opponentId != 'Slot'){
					if(this.host){
						socket.emit('checkboxChanged', opponentId, this.player1Check.checked);
					} else {
						socket.emit('checkboxChanged', opponentId, this.player2Check.checked);
					}
				}
			}
			else
				console.log('failed to get current room');
		});

	}

	update(){

	}

	getOpponentId(){
		try{
			if(this.host) 
				return this.player2Name.innerText.match(/(?<=opponent:\s)[a-zA-Z0-9_-]+/g)[0];
		
			return this.player1Name.innerText.match(/(?<=opponent:\s)[a-zA-Z0-9_-]+/g)[0];
		} catch (err) {
			console.error("opponent player missing: ", err)
		}
	}

	refreshRoom(data){
		
		if(data.player.length == 1){
			this.host = true;
			this.player2Check.checked = false;
		}

		this.roomName.innerText = `${data.name} id: ${data.id}`;
		this.player1Name.innerText = `${this.host ? "you: " : "opponent: "}${data.player[0]}`;
		this.player2Name.innerText = `${!this.host ? "you: " : "opponent: "}${data.player.length == 2 ? data.player[1] : "Slot Empty"}`;
		

		if(!this.host){
			this.startRoom.disabled = true;
			this.player1Check.disabled = true;
			this.player2Check.disabled = false;
		}else{
			this.startRoom.disabled = false;
			this.player1Check.disabled = false;
			this.player2Check.disabled = true;
		}

	}// end refreshRoom
}
