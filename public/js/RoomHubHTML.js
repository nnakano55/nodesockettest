
function setRoomHubHTML(html, state){

	let menu = html.getChildByID('menu');
	let findRoomMenu = menu.children.findRoomMenu;
	let createRoomMenu = menu.children.createRoomMenu;

	let contents = html.getChildByID('contents');
	let createRoom = contents.querySelector('#createRoom');
	let findRoom = contents.querySelector('#browseRoom');

	let textbox = createRoom.querySelector('#textbox');
	let submit = createRoom.querySelector('#submit');
	
	let roomTable = findRoom.querySelector('#roomTable');
	let roomJoin = findRoom.querySelector('#join');
	let roomRefresh = findRoom.querySelector('#refresh');
	let roomSearch = findRoom.querySelector('#searchbox');
	let roomSearchOption = findRoom.querySelector('#searchOption');

	roomRefresh.addEventListener('click', () => {
		if(roomSearchOption.value !== '')
			refreshTableInfoSearching(roomTable, roomSearchOption.value, roomSearch.value);
		else
			refreshTableInfo(roomTable);
	});

	roomSearch.addEventListener('keydown', (event) => {
		refreshTableInfoSearching(roomTable, roomSearchOption.value, roomSearch.value);
	});

	textbox.addEventListener('keydown', (event) => {
		if(event.keyCode == 13 && textbox.value != ''){
			socket.emit('console', `ENTER PRESSED: ${textbox.value}`);
			socket.emit('createRoom', textbox.value, (res) => {
    				//refreshTableInfo(roomTable);
					state.scene.start('RoomState');
			});
			textbox.value = '';

		}
	});

	submit.addEventListener('click', () => {
		if(textbox.value != ''){
			socket.emit('console', `BUTTON PRESSED: ${textbox.value}`);
			socket.emit('createRoom', textbox.value, (res) => {
    				//refreshTableInfo(roomTable);
					state.scene.start('RoomState');
			});
			textbox.value = '';
		}
	});

	findRoomMenu.addEventListener('click', () => {
		findRoomMenu.setAttribute('class', 'active');
		createRoomMenu.setAttribute('class', '');
		findRoom.style.display = 'flex';
		createRoom.style.display = 'none';
	});

	createRoomMenu.addEventListener('click', () => {
		createRoomMenu.setAttribute('class', 'active');
		findRoomMenu.setAttribute('class', '');
		createRoom.style.display = 'flex';
		findRoom.style.display = 'none';
	});
	
	roomJoin.addEventListener('click', () => {
		let active = roomTable.querySelector('.active');
		if(active){
			console.log(active.children[1].innerText);
			let id = active.children[1].innerHTML.match(/(?<=id:\s)[a-zA-Z0-9]+/g)[0];
			console.log(id);
			socket.emit('joinRoom', id, () => {
				state.scene.start('RoomState');
			});
			//socket.emit('console', `check active click: ${id}`);
		}
	});

	refreshTableInfo(roomTable);

}

function refreshTableInfo(table){
	table.innerHTML = '';
	socket.emit('getRooms', (data) => {
		let info = JSON.parse(data);
		console.log(info);
		for(room of info){
			let tr = document.createElement('tr');
			tr.innerHTML = `
				<td>Room name: ${room.name}</td>
				<td>id: ${room.id}</td>
				<td>Players: ${room.players}</td>`;

			tr.addEventListener('click', () => {
				let list = table.querySelectorAll('tr');
				for(item of list)
					item.setAttribute('class', '');
				tr.setAttribute('class', 'active');
			});
			table.append(tr);
		}

	});
}

function refreshTableInfoSearching(table, type='', value=''){
	if(value === ''){
		refreshTableInfo(table);
		return;
	}

	table.innerHTML = '';
	socket.emit('getRooms', (data) => {
		let info = JSON.parse(data);
		console.log(info);
		for(let i = 0; i < info.length; i++){

			if(type === 'name' && !info[i].name.includes(value)){
				console.log('continue');
					continue;
			} else if(type === 'id' && !info[i].id.includes(value)) {
				if(!info[i].id.includes(value))
					continue;
			}
			console.log('passed');
			let tr = document.createElement('tr');
			tr.innerHTML = `
				<td>Room name: ${info[i].name}</td>
				<td>id: ${info[i].id}</td>
				<td>Players: ${info[i].players}</td>`;

			tr.addEventListener('click', () => {
				let list = table.querySelectorAll('tr');
				for(item of list)
					item.setAttribute('class', '');
				tr.setAttribute('class', 'active');
			});
			table.append(tr);
		}

	});
}

