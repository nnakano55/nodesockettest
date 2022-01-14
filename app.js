// Testing vim 
const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const server = http.createServer(app);
const port = process.env.PORT||3000;

const { Server } = require('socket.io');
const io = new Server(server);

const rooms = {};

const joinRoom = (socket, room) => {
	room.sockets.push(socket);
	socket.join(room.id, () => {
		socket.roomId = room.id;
	});
};

const uuid = () => {
	let id = Math.random().toString(36).substr(2,9);
	console.log(id);
	if(rooms[id])
		return uuid();
	return id;
};

const opponentId = (socket, room) => {
	for(data of room.sockets){
		if(data.id !== socket.id)
			return data.id;
	}
};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
	res.send('root');
});

io.on('connection', (socket) => {
	
	console.log('a user connected: ', socket.id);
	
	socket.on('getRooms', (callback) => {
		console.log('rooms called!');
		let roomList = Object.values(rooms);
		let tempString = '[' + roomList.map(data => {
			return JSON.stringify({name: data.name, id: data.id, players: data.sockets.length});
		}).join(', ') + ']';
		//console.log(tempString);
		callback(tempString); 
	});

	socket.on('console', (msg) => {
		
		console.log(`${socket.id}: ${msg}`);
	
	});	
	
	socket.on('getCurrentRoom', (callback) => {
		
		let roomData = socket.rooms;
		let id;
		let num = 0;
		for(data of roomData){
			if(num == 0){
				num++;
				continue;
			}
			id = data;
		}
		let room = rooms[id];
		if(room){
			let opponent = room.sockets.map((data) => data.id);
			let tempString = JSON.stringify({name: room.name, id: room.id, player: opponent});
			io.to(opponent).emit('opponentEnteredRoom');
			callback(true, tempString);
		}else{
			callback(false, "nope");
		}
	});
	
	socket.on('startGame', () => {
		
		let roomData = socket.rooms;
		let id;
		let num = 0;
		for(data of roomData){
			if(num == 0){
				num++;
				continue;
			}
			id = data;
		}
		let room = rooms[id];
		if(room){
			io.to(id).emit('startGameClient');
		}
	});

	socket.on('createRoom', (name, callback) => {
		const room = {
			id: uuid(),
			name: name,
			sockets: []
		};
		rooms[room.id] = room;
		console.log(rooms);
		joinRoom(socket, room);
		socket.roomId = room.id;
		callback({status: `room created! id: ${room.id} name: ${name}`});
	});

	socket.on('joinRoom', (roomId, callback) => {
		const room = rooms[roomId];
		if(room && room.sockets.length < 2){
			joinRoom(socket, room);
			socket.roomId = room.id;
			console.log(socket.roomId);
			io.to(roomId).emit('roomUpdated');
			callback(true);
		}
		else{
			callback(false);
		}
	});

	socket.on('leaveRoom', (callback) => {
		let roomData = socket.rooms;
		let id;
		let num = 0;
		for(data of roomData){
			if(num == 0){
				num++;
				continue;
			}
			id = data;
		}
		let room = rooms[id];
		
		if(room.sockets[0].id === socket.id)
			room.sockets.shift();
		else 
			room.sockets.pop();

		if(room.sockets.length == 0){
			delete rooms[id];
		}

		socket.leave(id);
		io.to(id).emit('roomUpdated');

		callback();

	});

	socket.on('checkboxChanged', (opponentID, currentState) => {
		console.log(`opponentid: ${opponentID}, currentState: ${currentState}`);

		io.to(opponentID).emit('opponentCheckUpdated', currentState);
	});

	socket.on('disconnect', () => {
		console.log('user disconnected');
		let roomData = socket.rooms;
		console.log(socket.roomId);
		let id;
		let num = 0;
		for(data of roomData){
			if(num == 0){
				num++;
				continue;
			}
			id = data;
		}
		let room = rooms[socket.roomId];
		if(room){	
			if(room.sockets[0].id === socket.id)
				room.sockets.shift();
			else 
				room.sockets.pop();

			if(room.sockets.length === 0){
				delete rooms[id];
			}

			socket.leave(socket.roomId);
		}
	});

	socket.on('chat message', (msg) => {
		io.emit('chat message', `${socket.id}: ${msg}`);
	});

	socket.on('welcome', () => {
		socket.emit('consoleMessage', `Welcome, ${socket.id}!`);
		console.log('welcome');
		//io.emit('chat message', `Welcome, ${socket.id}!`);
	});

	socket.on('/returnid', () => {
		socket.emit('chat message', socket.id);
		//io.emit('chat message', socket.id);
	});	

	socket.on('starsCollected', () => {
		io.emit('consoleMessage', `${socket.id}: stars collected!`);
	});

	socket.on('upPlayersInfo', () => {
		let info = io.sockets.adapter.rooms.get(socket.roomId);
		//console.log(info);
		let size = info ? info.size : 0;
		io.to('room').emit('playerInfo', `Users: ${size}`);
	});

});

server.listen(port, () => {
	console.log('listening on *:', port);
});



