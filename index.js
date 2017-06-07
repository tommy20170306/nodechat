var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var dateFormat = require('dateformat');

app.use('/assets', express.static(__dirname + '/public'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

var online_user = [];

io.on('connection', (socket) => {
	var usr;

	socket.on('enter', (username) => {
		usr = username;
		online_user.push(usr);
		io.emit('notice message', "online users: "+online_user);
		//io.emit('notice message', usr+' connected');			
	});

	socket.on('leave', () => {
		io.emit('notice message', usr+' disconnected');
	});

	socket.on('chat message', (username, msg) => {
		var date = Date();
		io.emit('chat message', dateFormat(date, "HH:MM:ss dd/mm/yyyy") +"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +username+": "+msg );
	});

	socket.on('typing', (username) => {
		io.emit('typing', username);
	});

	socket.on('disconnect', () => {	
		if(usr !== undefined){
			online_user.splice(online_user.indexOf(usr), 1);
		}
		io.emit('notice message', "online users: "+online_user);
		//io.emit('notice message', usr+' disconnected');	
	});
}); 

http.listen(3002, () => {

});