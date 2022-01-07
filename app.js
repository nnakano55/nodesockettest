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

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
	res.send('root');
});

io.on('connection', (socket) => {
	
	console.log('a user connected: ', socket.id);
	
	socket.on('getRooms', (callback) => {
		console.log('rooms called!');
		let roomList = Object.values(rooms);
		let tempString = roomList.map(data => {
			return JSON.stringify({name: data.name, id: data.id, players: data.sockets.length});
		}).join(', ');
		//console.log(tempString);
		callback(tempString); 
	});

	socket.on('console', (msg) => {
		
		console.log(`${socket.id}: ${msg}`);
	
	});	
	
	socket.on('createRoom', (name, callback) => {
		const room = {
			id: uuid(),
			name: name,
			sockets: []
		};
		rooms[room.id] = room;
		joinRoom(socket, room);
		callback({status: `room created! id: ${room.id} name: ${name}`});
	});

	socket.on('joinRoom', (roomId, callback) => {
		const room = rooms[roomId];
		joinRoom(socket, room);
		callback();
	});

	socket.on('disconnect', () => {
		console.log('user disconnected');
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



