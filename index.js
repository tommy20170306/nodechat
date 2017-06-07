const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const dateFormat = require('dateformat');
const sanitizeHtml = require('sanitize-html');
const url = require('url');

app.use('/assets', express.static(__dirname + '/public'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

app.get('/chat', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

var online_user = {};

//Server emit =>(triggers) client on
//Client emit => server on
io.on('connection', (socket) => {
	var usr;
	var room;

	online_user.room = [];

	socket.on('exist user', (username, userToken) => {
		io.emit('exist', username.trim() === "" || ( online_user.room.indexOf(username) > -1 ), userToken );
	});

	socket.on('enter', (username, r) => {
		room = r;
		socket.join(room);

		usr = username;
		online_user.room.push(usr);
		io.to(room).emit('online user', online_user.room);
		io.to(room).emit('notice message', usr+' connected');	
	});

	socket.on('leave', () => {
		io.to(room).emit('notice message', usr+' disconnected');
	});

	socket.on('chat message', (username, msg) => {

		msg = sanitizeHtml(msg, {
		  allowedTags: [],
		  allowedAttributes: []
		});

		if(msg.trim() !== ""){
			var date = Date();
			io.to(room).emit('chat message', "<small style='font-weight:300;'>"+dateFormat(date, "HH:MM:ss dd/mm/yyyy") +"</small>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +username+": "+msg );
		}
	});

	socket.on('typing', (username) => {
		io.to(room).emit('typing', username);
	});

	socket.on('disconnect', () => {	
		if(usr !== undefined){
			online_user.room.splice(online_user.room.indexOf(usr), 1);
			io.to(room).emit('online user', online_user.room);
			io.to(room).emit('notice message', usr+' disconnected');	
		}
	});
}); 

http.listen(3002, () => {

});