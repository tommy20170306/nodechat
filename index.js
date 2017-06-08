const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {serveClient: true});
const dateFormat = require('dateformat');
const sanitizeHtml = require('sanitize-html');
const url = require('url');

app.use('/assets', express.static(__dirname + '/public'));

app.get('/', (req, res) => {
	res.redirect('/chat-room-'+Math.floor(Math.random()*2 + 1));
});

app.get('/chat-room-1', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

app.get('/chat-room-2', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

var online_user = {};

//Server emit =>(triggers) client on
//Client emit => server on
io.on('connection', (socket) => {
	var usr;
	var room;

	socket.on('exist user', (username, userToken, r) => {
		if(typeof online_user[r] === 'undefined'){
			online_user[r] = new Array();
		}

		username = sanitizeHtml(username, {
		  allowedTags: [],
		  allowedAttributes: []
		});

		username = username.replace(/[^a-zA-Z0-9]/g,'_');

		io.emit('exist', username.trim() === "" || ( online_user[r].indexOf(username) > -1 ), userToken );
	});

	socket.on('enter', (username, r) => {
		room = r;

		if(typeof online_user[r] === 'undefined'){
			online_user[room] = new Array();
		}

		socket.join(room);

		//change all characters except numbers and letters
		username = username.replace(/[^a-zA-Z0-9]/g,'');

		usr = username;
		online_user[room].push(usr);
		io.to(room).emit('online user', online_user[room]);
		io.to(room).emit('notice message', usr+' connected');	

		//Get a list of client IDs connected
		io.in(room).clients((err, clients) => {
			if(err) throw err;
			//console.log("All clients in "+room);
			//console.log(clients);
		});

		//Assign key <=> value to username <=> socket.id
		online_user[r][username] = socket.id;
		//console.log("Socket: ");
		//console.log(socket.id);
	});

	socket.on('leave', () => {
		io.to(room).emit('notice message', usr+' disconnected');
	});

	socket.on('chat message', (username, msg, receiver) => {

		msg = sanitizeHtml(msg, {
		  allowedTags: [],
		  allowedAttributes: []
		});

		if(msg.trim() !== ""){
			var date = Date();
			if(receiver === "All"){
				io.to(room).emit('chat message', "<small style='font-weight:300;'>"+dateFormat(date, "HH:MM:ss dd/mm/yyyy") +"</small>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +usr+": "+msg );
			}else{
				io.to(online_user[room][receiver]).to(online_user[room][username]).emit('chat message', "<small style='font-weight:300;'>"+dateFormat(date, "HH:MM:ss dd/mm/yyyy") +"</small>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(private) " +usr+": "+msg );
			}
		}

		//console.log(receiver);
		//console.log(online_user[room][receiver]);
	});

	socket.on('typing', (username) => {
		io.to(room).emit('typing', usr);
	});

	socket.on('disconnect', () => {	
		if(usr !== undefined){
			online_user[room].splice(online_user[room].indexOf(usr), 1);
			io.to(room).emit('online user', online_user[room]);
			io.to(room).emit('notice message', usr+' disconnected');
		}
	});
}); 

http.listen(3002, () => {

});