// Init phaser and sockets

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 400,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [StateTitle, RoomHub]
};

var player;
var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;

var game = new Phaser.Game(config);

var socket = io();
	
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


