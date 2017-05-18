var express = require('express');
var path = require('path');
var fs = require('fs');
//var app = express();
var bodyParser = require('body-parser');
var utf = require('utf8');
var protocol = require('http');
var static = require('node-static');
var url = require('url');
var util = require('util');
var file = new (static.Server)();
var portNo = 3000;

var Twit = require('twit');
var client = new Twit({
	consumer_key: '4KmRYi0xBi5ItjYZjBYKEupz8',
	consumer_secret: 'QHQpacx40n2r7Qqd2uyVXRcbxiUnwvVhcVlhNyc3QQ0R7EkwbH',
	access_token: '4735515988-qKjtBP2qHfgcML3moEsNyaUgGECzFzU1goLDkRF',
	access_token_secret: 'ivIC1P7aW9Kx4lmLQqst4Q6OPE32zh3xwrGDIz37ufnKj'
});

//app.use(bodyParser());

//app.use('/cssFiles', express.static(__dirname+'/css'));

//app.get('/', function(req, res) {
//	res.sendFile('index.html', {root: path.join(__dirname)});
//});

var mysql = require('mysql')
var connection = mysql.createConnection({
	host     : 'stusql.dcs.shef.ac.uk',
	user     : 'acr16rm',
	password : '1c6c2403',
	database : 'acr16rm'
});
//mysql -u acr16rm -h stusql.dcs.shef.ac.uk -p
function addslashes( str ) {
	return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

function waitCallBack(param1, callback) {
	console.log('entering...');
	setTimeout(function () {
		if (callback && typeof(callback) === "function") {
			console.log('exiting...');
			callback();
		}
	}, param1);
}

var app = protocol.createServer(function (req, res) {
	var pathname = url.parse(req.url).pathname;
	var body = '';

	if ((req.method == 'POST') && (pathname == '/index.html')) {
		var dataFin = {ok: 'ok'};
		req.on('data', function (data) {
			body += data;
		});

		req.on('end', function () {
			body= JSON.parse(body);

			var queryInput= body.query;
			var querynew = '';
			////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			var who = queryInput.substring(queryInput.indexOf("(")+1, queryInput.indexOf("AND")-2);
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
			var team = queryInput.substring(queryInput.indexOf("AND")+10, queryInput.length-1);
			//console.log('team: '+team);
			while(team.indexOf("\\\"")!=-1)
			{
				team = team.replace("\\\"", "");
			}
			querynew = querynew + ' ' + team;
			////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			var tweetpack = {"tweet": []};
			var queryID = '';
			var querylength = querynew.length;
			//for(var i=0; i<3; i++)

			var number =1;
			var i = 0;
			{
				runQuery(querynew, querylength, queryID, tweetpack, i, number, res);
			}
/*
			client.get('search/tweets', { q: querynew, count: 10},
				function (err, data, response) {
					for (var indx in data.statuses) {
						var tweet = data.statuses[indx];
						console.log('on: ' + tweet.created_at + ' : @' + addslashes(tweet.user.screen_name) + ' : ' + addslashes(tweet.text) + '\n\n');
						res.writeHead(200, { "Content-Type": "application/json"});
						res.end(JSON.stringify(data));
					}
				});
				*/

//            waitCallBack(5000, function () {
//                res.writeHead(200, {"Content-Type": "text/plain"});
//                console.log('body: ' + body);
//                res.end(JSON.stringify(body));
//            });
});
	}
	else {
		file.serve(req, res, function (err, result) {
			if (err != null) {
                        //console.error('url: '+req.url);
                        //console.error('err: '+err.message);
                        console.error('Error serving %s - %s', req.url, err.message);
                        if (err.status === 404 || err.status === 500) {
                        	file.serveFile(util.format('/%d.html', err.status), err.status, {}, req, res);
                        } else {
                        	res.writeHead(err.status, err.headers);
                        	res.end();
                        }
                    } else {
                    	res.writeHead(200, {"Content-Type": "text/plain", 'Access-Control-Allow-Origin': '*'});

                    }
                });
	}
}).listen(3000);

function runQuery(querynew, querylength, queryID, tweetpack, i, number, res){
	i++
	//console.log('round:'+i);
	client.get('search/tweets', { q: querynew, count: 10}, function(err, data, response) {
		if (err) return console.error(err);
		for (var indx in data.statuses) 
		{
			var tweet= data.statuses[indx];
			queryID = tweet.id;

			//console.log('ID: '+queryID);
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

			//console.log('number:'+number);
			var newtweet = tweet.text.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '');
			while(newtweet.indexOf("\"")!=-1)
			{
				newtweet = newtweet.replace("\"", "\'\'");
			}

		}
		//console.log('set: '+queryID);
		querynew = querynew.substring(0, querylength) + ' max_id:' + queryID;
		//console.log(i+'update: '+querynew);
		queryID = '';

			//console.log(tweetpack.tweet);
		if(i<3)
		{
			runQuery(querynew, querylength, queryID, tweetpack, i, number, res);
		}
		if(i==3)
		{
			res.writeHead(200, { "Content-Type": "application/json"});
			res.end(JSON.stringify(tweetpack));
		}
	})
	//console.log(tweetpack.tweet);
};

/*
var app = protocol.createServer(function (req, res) {


	res.writeHead(200, {"Content-Type": 'text/JSON', 'charset': 'utf-8'});
	//connection.connect()
	console.log('query: '+req.query);
	var queryInput = JSON.stringify(req.query);
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

	var tweetpack = {"tweet": []};
	var querydate = '';
	querynew = querynew + 'until:';
	var querylength = querynew.length;
	//for(var i=0; i<3; i++)
	var i = 0;
	{
		runQuery(querynew, querylength, querydate, tweetpack, i);
	}
	res.end();
});
*/
/*
app.listen(3000, function() {
	console.log('Listening ar port 3000');
});*/