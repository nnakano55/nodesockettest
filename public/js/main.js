// Init phaser and sockets

var config = {
    type: Phaser.AUTO,
    parent:'phaser-container',
    width: 800,
    height: 400,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    dom: {
	   createContainer: true
    },
    scene: [StateTitle, RoomHub, StateRoom, Pong]
};
var multiplayer = false;
var socket = io();
var game = new Phaser.Game(config);
	
socket.on('connect', () => {
	socket.emit('welcome'); 
	socket.emit('console', 'testing');
});

socket.on('consoleMessage', (msg) => {
   console.log(msg);
});

socket.on('playerInfo', (msg) => {
   //console.log(msg);
});


