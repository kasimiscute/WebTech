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
	res.writeHead(200, {"Content-Type": 'text/JSON', 'charset': 'utf-8'});
	//connection.connect()
	var queryInput = JSON.stringify(req.body.query);
	//console.log(queryInput);
	var querynew = '';
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var who = queryInput.substring(6, queryInput.indexOf("AND")-2);
	while(who.indexOf("\\\"")!=-1)
	{
		who = who.replace("\\\"", "");
	}
	while(who.indexOf("OR")!=-1)
	{
		querynew = querynew + 'from:' + who.substring(0, who.indexOf("OR"))+ 'OR ';
		who = who.substring(who.indexOf(" ")+4, who.length);
		//console.log('processing: '+who);
	}
	querynew = querynew + 'from:' + who;
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var team = queryInput.substring(queryInput.indexOf("AND")+10, queryInput.length-2);
	//console.log('team: '+team);
	while(team.indexOf("\\\"")!=-1)
	{
		team = team.replace("\\\"", "");
	}
	querynew = querynew + ' ' + team;
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	console.log('query: '+querynew);

	try{
		var tweetpack = {"tweet": []};
		var querydate = '';
		querynew = querynew + 'until:';
		var querylength = querynew.length;
		for(var i=0; i<3; i++)
		{
			querynew = querynew.substring(0, querylength) + querydate;
			console.log('update: '+querynew);
			querydate = '';

			setTimeout(function runquery(){
				client.get('search/tweets', { q: querynew, count: 10}, function(err, data, response) {
					if (err) return console.error(err);
					var number =1;
					for (var indx in data.statuses) 
					{
						var tweet= data.statuses[indx];
						var tweetObj = {
							"index": number,
							"date": tweet.created_at,
							"author": tweet.user.screen_name,
							"turl": tweet.user.url,
							"uurl": tweet.entities.url,
							"content": tweet.text
						};

						tweetpack.tweet.push(tweetObj);
						number++


						querydate = tweet.created_at.substring(tweet.created_at.length-4, tweet.created_at.length) 
						+ '-'+ tweet.created_at.substring(4, 7) + '-'+ tweet.created_at.substring(8, 10);
						//querydate = querydate.substring()
						//querydate = querydate.replace("May", "05");
						//console.log('date: '+tweet.created_at);



						var newtweet = tweet.text.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '');
						while(newtweet.indexOf("\"")!=-1)
						{
							newtweet = newtweet.replace("\"", "\'\'");
						}

						if(res.finished){
							break;
						}
					}
					querydate = querydate.replace("May", "05");
					console.log('set: '+querydate);
				})
			}, 2000);
		}
		
	} catch(err) {
		res.sendFile('404.html', {root: path.join(__dirname)});
	}
	res.end();
});

app.listen(3000, function() {
	console.log('Listening ar port 3000');
});