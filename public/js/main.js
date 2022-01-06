// Init phaser and sockets

import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin';

var config = {
    type: Phaser.AUTO,
    parent:'phaser-container',
    width: 800,
    height: 400,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    dom: {
	createContainer: true
    },
    plugins: {
	scene: [
	     {
		key: 'rexUI',
		plugin: RexUIPlugin,
		mapping: 'rexUI'     
	     }
	]
    },
    scene: [StateTitle, RoomHub]
};

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


