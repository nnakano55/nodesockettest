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

const timeout = 100;

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
	socket.roomId = '';
	socket.isHost = false;
	socket.isReady = false;

	socket.on('sendPlayerDataRollback', (data) => {
		let room = rooms[socket.roomId];
		if(room){
			if(socket.isHost){
				io.to(room.sockets[1].id).emit('getRollbackData', data);
			} else {
				io.to(room.sockets[0].id).emit('getRollbackData', data);
			}
		}	
	});

	socket.on('initiateGame', () => {
		socket.isReady = true;
		let room = rooms[socket.roomId];
		if(room && room.sockets.length == 2){
			if(room.sockets[0].isReady && room.sockets[1].isReady){
				let x = Math.floor(Math.random() * 2) == 0 ? 200 : -200;
				let y = Math.floor(Math.random() * 2) == 0 ? 200 : -200;
				let out = JSON.stringify({velocityX: x, velocityY: y});
				console.log(`game start: ${out}`);
				io.to(room.id).emit('gameStart', out);
			}
		}

	});

	socket.on('sendPlayerData', (data) => {
		let room = rooms[socket.roomId];
		if(room){
			if(socket.isHost){
				io.to(room.sockets[1].id).emit('receiveOpponentData', data);
			} else {
				io.to(room.sockets[0].id).emit('receiveOpponentData', data);
			}
		}	
	});

	socket.on('sendPlayerCollision', (data) => {
		let room = rooms[socket.roomId];
		if(room){
			if(socket.isHost){
				io.to(room.sockets[1].id).emit('receiveOpponentCollision', data);
			} else {
				io.to(room.sockets[0].id).emit('receiveOpponentCollision', data);
			}
		}
	});

	socket.on('sendPlayerLoss', () => {
		let room = rooms[socket.roomId];
		socket.isReady = false;
		if(room){
			if(socket.isHost){
				io.to(room.sockets[1].id).emit('receiveOpponentLoss');
			} else {
				io.to(room.sockets[0].id).emit('receiveOpponentLoss');
			}
		}
	});

	/* latency check version
	 * 
	 */
	socket.on('initiateGameDEBUG', () => {
		setTimeout(() => {
			socket.isReady = true;
			let room = rooms[socket.roomId];
			if(room && room.sockets.length == 2){
				if(room.sockets[0].isReady && room.sockets[1].isReady){
					let x = Math.floor(Math.random() * 2) == 0 ? 200 : -200;
					let y = Math.floor(Math.random() * 2) == 0 ? 200 : -200;
					let out = JSON.stringify({velocityX: x, velocityY: y});
					console.log(`game start: ${out}`);
					io.to(room.id).emit('gameStart', out);
				}
			}
		}, timeout);
	});

	socket.on('sendPlayerDataDEBUG', (data) => {
		setTimeout(() => {
			let room = rooms[socket.roomId];
			if(room){
				if(socket.isHost){
					io.to(room.sockets[1].id).emit('receiveOpponentData', data);
				} else {
					io.to(room.sockets[0].id).emit('receiveOpponentData', data);
				}
			}	
		}, timeout);
	});

	socket.on('sendPlayerCollisionDEBUG', (data) => {
		setTimeout(() => {
			let room = rooms[socket.roomId];
			if(room){
				if(socket.isHost){
					io.to(room.sockets[1].id).emit('receiveOpponentCollision', data);
				} else {
					io.to(room.sockets[0].id).emit('receiveOpponentCollision', data);
				}
			}
		}, timeout);
	});

	socket.on('sendPlayerLossDEBUG', () => {
		setTimeout(() => {
			let room = rooms[socket.roomId];
			socket.isReady = false;
			if(room){
				if(socket.isHost){
					io.to(room.sockets[1].id).emit('receiveOpponentLoss');
				} else {
					io.to(room.sockets[0].id).emit('receiveOpponentLoss');
				}
			}
		}, timeout);
	});

	/* End latancy check
	 *
	 */

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
		
		let room = rooms[socket.roomId];
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
		let room = rooms[socket.roomId];
		if(room){
			io.to(socket.roomId).emit('startGameClient');
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
		socket.isHost = true;
		callback({status: `room created! id: ${room.id} name: ${name}`});
	});

	socket.on('joinRoom', (roomId, callback) => {
		const room = rooms[roomId];
		if(room && room.sockets.length < 2){
			joinRoom(socket, room);
			socket.roomId = room.id;
			socket.isHost = false;
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
		let room = rooms[socket.roomId];
		if(room){
			if(room.sockets[0].id === socket.id)
				room.sockets.shift();
			else 
				room.sockets.pop();
	
			if(room.sockets.length > 0 && socket.isHost == true){
				room.sockets[0].isHost = true;
				socket.isHost = false;
			}
	
			if(room.sockets.length == 0){
				delete rooms[socket.roomId];
			}

			socket.leave(socket.roomId);
			// emitting roomUpdated and callback might be a recipe for disaster at worst
			// probably unclean and messy at best
			io.to(socket.roomId).emit('roomUpdated');
			socket.roomId = '';
			socket.isHost = false;
			socket.isReady = false;
		}
		callback();

	});

	socket.on('checkboxChanged', (opponentID, currentState) => {
		console.log(`opponentid: ${opponentID}, currentState: ${currentState}`);

		io.to(opponentID).emit('opponentCheckUpdated', currentState);
	});

	socket.on('disconnect', () => {
		console.log('user disconnected');
		let roomData = socket.rooms;
		let room = rooms[socket.roomId];
		if(room){	
			if(room.sockets[0].id === socket.id)
				room.sockets.shift();
			else 
				room.sockets.pop();

			if(room.sockets.length === 0){
				delete rooms[socket.roomId];
			}

			socket.leave(socket.roomId);
			io.to(socket.roomId).emit('disconnected');
		} else {
			console.log('room not found');
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



