
function setRoomHubHTML(html, state){

	let menu = html.getChildByID('menu');
	let findRoomMenu = menu.children.findRoomMenu;
	let createRoomMenu = menu.children.createRoomMenu;

	let contents = html.getChildByID('contents');
	console.log(contents.children.createRoom);
	console.log(contents.querySelector('#createRoom').querySelector('#textbox'));
	let createRoom = contents.querySelector('#createRoom');
	let findRoom = contents.querySelector('#browseRoom');

	let textbox = createRoom.querySelector('#textbox');
	textbox.addEventListener('keydown', (event) => {
		if(event.keyCode == 13 && textbox.value != ''){
			socket.emit('console', `ENTER PRESSED: ${textbox.value}`);
			socket.emit('createRoom', textbox.value, (res) => {
    				socket.emit('console',JSON.stringify(res));
			});
			textbox.value = '';
		}
	});

	let submit = createRoom.querySelector('#submit');
	submit.addEventListener('click', () => {
		if(textbox.value != ''){
			socket.emit('console', `BUTTON PRESSED: ${textbox.value}`);
			socket.emit('createRoom', textbox.value, (res) => {
    				socket.emit('console',JSON.stringify(res));
			});
			textbox.value = '';
		}
	});

	findRoomMenu.addEventListener('click', () => {
		findRoomMenu.setAttribute('class', 'active');
		createRoomMenu.setAttribute('class', '');
		findRoom.style.display = 'flex';
		createRoom.style.display = 'none';
		console.log('called');
	});

	createRoomMenu.addEventListener('click', () => {
		createRoomMenu.setAttribute('class', 'active');
		findRoomMenu.setAttribute('class', '');
		createRoom.style.display = 'flex';
		findRoom.style.display = 'none';
		console.log('called');
	});
}

