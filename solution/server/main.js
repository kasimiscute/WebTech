var express = require('express');
var path = require('path');
var fs = require('fs');
var app = express();
var bodyParser = require('body-parser');
var utf = require('utf8');

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

var mysql = require('mysql')
var connection = mysql.createConnection({
	host     : 'stusql.dcs.shef.ac.uk',
	user     : 'acr16rm',
	password : '1c6c2403',
	database : 'acr16rm'
});
//mysql -u acr16rm -h stusql.dcs.shef.ac.uk -p

app.post('/search_old', function(req, res) {
	//res.setHeader('Content-Type', 'text/html');
	//res.setHeader('Content-Length', body.length);
	res.writeHead(200, {"Content-Type": 'text/html', 'charset': 'utf-8'});
	//connection.connect()
	var queryInput = JSON.stringify(req.body.query);
	//console.log(queryInput);
	var queryNew = '';
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var who = queryInput.substring(6, queryInput.indexOf("AND")-2);
	while(who.indexOf("\\\"")!=-1)
	{
		who = who.replace("\\\"", "");
	}
	while(who.indexOf("OR")!=-1)
	{
		queryNew = queryNew + 'from:' + who.substring(0, who.indexOf("OR"))+ 'OR ';
		who = who.substring(who.indexOf(" ")+4, who.length);
		//console.log('processing: '+who);
	}
	queryNew = queryNew + 'from:' + who;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var team = queryInput.substring(queryInput.indexOf("AND")+10, queryInput.length-2);
	//console.log('team: '+team);
	while(team.indexOf("\\\"")!=-1)
	{
		team = team.replace("\\\"", "");
	}
	/*while(team.indexOf("OR")!=-1)
	{
		queryNew = queryNew + ' ' + team.substring(0, team.indexOf("OR")+ 'OR ');
		team = team.substring(team.indexOf(" ")+4, team.length);
		console.log('processing: '+queryNew);
	}*/
	queryNew = queryNew + ' ' + team;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	console.log('query: '+queryNew);
	try{
		client.get('search/tweets', { q: queryNew, count: 100},
			function(err, data, response) {
				//console.log('from:'+JSON.stringify(req.body.username)+' AND '+JSON.stringify(req.body.query));
				//console.log(data.statuses.length);
				//console.log(JSON.stringify(req.body.query));
				res.write(
					'<html>'+
					'<head>'+
					'</head>'+
					'<body>'+
					'<div class="table-responsive">'+
					'<div class="col-lg-12">'+
					'<table class="table-hover col-lg-12 table-bordered table-striped">'+
					'<caption><h3>Result</h3></caption>'+
					'<a href="/">Home</a>'+
					'<thead>'+
					'<tr>'+
					'<th>Number</th>'+
					'<th>Author</th>'+
					'<th>Time and Date</th>'+
					'<th>Text</th>'+
					'<th>Original Link</th>'+
					'<th>Author page Link</th>'+
					'</tr>'+
					'</thead>'+
					'<tbody>'
					);
					var number = 1;
				for (var indx in data.statuses) {
					var tweet= data.statuses[indx];
					/*
					res.write(indx + '\nDate and time: ' + tweet.created_at + ', \nUser: @' + tweet.user.screen_name + 
						', \nlink: ' + tweet.user.url + ', \ntweet: ' + tweet.text+'\n\n');
					res.write(indx + '<br/>Date and time: ' + tweet.created_at + ', <br/>User: @' + tweet.user.screen_name + 
						', <br/>link: ' + tweet.user.url + ', <br/>tweet: ' + tweet.text+'<br/><br/>');
						*/
						/*
						if(tweet.entities.urls[0]!=null){
							console.log('tweet: '+tweet.entities.urls[0].url);
						}
						else{
							console.log('tweet: '+tweet.entities.urls[0]);
						}
						console.log('user: '+tweet.user.url);*/
						res.write(
							'<tr>'+
							'<td>'+number+'</td>'+
							'<td>'+tweet.user.screen_name+'</td>'+
							'<td>'+tweet.created_at+'</td>'+
							'<td>'+tweet.text+'</td>'+
							'<td>'+tweet.entities.url+'</td>'+
							'<td>'+tweet.user.url+'</td>'+
							'</tr>'
							);
						
						number++;
						var newtweet = tweet.text.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '');
						while(newtweet.indexOf("\"")!=-1)
						{
							newtweet = newtweet.replace("\"", "\'\'");
						}
						//var newtweet = utf.encode(tweet.text);
/*
						connection.query('insert into tweets value("'+tweet.user.screen_name+'","'+tweet.created_at+'","'+newtweet+'","'
							+tweet.url+'","'+'null'+'","'+tweet.id+'")', function(err, rows, field) {
								if(err) throw err
							})*/
						if(res.finished){
							console.log('Stopped');
							//connection.end().redirect('/');
						}
					}
					res.write(
						'</tbody>'+
						'</table>'+
						'</div>'+
						'</div>'+
						'</body>'+
						'</html>'
						);
					res.end();
				})
	} catch(err) {
		res.sendFile('404.html', {root: path.join(__dirname)});
	}
});

app.listen(3000, function() {
	console.log('Listening ar port 3000');
});