
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const port = process.env.PORT||3000;

const { Server } = require('socket.io');
const io = new Server(server);


app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
	
	console.log('a user connected: ', socket.id);
	socket.on('disconnect', () => {
		console.log('user disconnected');
	});

	socket.on('chat message', (msg) => {
		io.emit('chat message', msg);
	});

	socket.on('welcome', () => {
		socket.emit('chat message', `Welcome, ${socket.id}!`);
		//io.emit('chat message', `Welcome, ${socket.id}!`);
	});

	socket.on('/returnid', () => {
		socket.emit('chat message', socket.id);
		//io.emit('chat message', socket.id);
	});	

});

server.listen(port, () => {
	console.log('listening on *:', port);
});



