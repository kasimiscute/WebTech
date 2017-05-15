var express = require('express');
var path = require('path');
var fs = require('fs');
var app = express();
var bodyParser = require('body-parser');

var Twit = require('twit');
var client = new Twit({
	consumer_key: '4KmRYi0xBi5ItjYZjBYKEupz8',
	consumer_secret: 'QHQpacx40n2r7Qqd2uyVXRcbxiUnwvVhcVlhNyc3QQ0R7EkwbH',
	access_token: '4735515988-qKjtBP2qHfgcML3moEsNyaUgGECzFzU1goLDkRF',
	access_token_secret: 'ivIC1P7aW9Kx4lmLQqst4Q6OPE32zh3xwrGDIz37ufnKj'
});

app.use(bodyParser());

app.use('/cssFiles', express.static(__dirname+'/css'));

app.get('/', function(req, res) {
	res.sendFile('index.html', {root: path.join(__dirname)});
});

app.post('/search', function(req, res) {
	res.setHeader('Content-Type', 'text/html');
	//res.setHeader('Content-Length', body.length);
	try{
		client.get('search/tweets', { q: JSON.stringify(req.body.query), count: 300},
			function(err, data, response) {

				console.log(data.statuses.length);

				for (var indx in data.statuses) {
					var tweet= data.statuses[indx];
					/*
					res.write(indx + '\nDate and time: ' + tweet.created_at + ', \nUser: @' + tweet.user.screen_name + 
						', \nlink: ' + tweet.user.url + ', \ntweet: ' + tweet.text+'\n\n');
					*/
					res.write(indx + '<br/>Date and time: ' + tweet.created_at + ', <br/>User: @' + tweet.user.screen_name + 
						', <br/>link: ' + tweet.user.url + ', <br/>tweet: ' + tweet.text+'<br/><br/>');

					if(res.finished){
						console.log('Stopped');
						res.end();
					}
					/*console.log('Date and time: ' + tweet.created_at + ', \nUser: @' + tweet.user.screen_name + 
					', \nlink: ' + tweet.user.url + ', \ntweet: ' + tweet.text+'\n\n');*/
				}
			})
	} catch(err) {
		res.sendFile('404.html', {root: path.join(__dirname)});
	}
});

app.listen(3000, function() {
	console.log('Listening ar port 3000');
});