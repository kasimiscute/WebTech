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
});/*
var client = new Twit({
  consumer_key: 'ZpWAwi7iJdurv8YzDdmdvBebQ',
  consumer_secret: 'h6HJecg5AKnzrtfLWVVzqoZ7DKjo3s2KTKz1xmWiYiIqM2ralV',
  access_token: '842778473454288896-cp8N3XoTQ9Kg1wEfKAOWARHBDeEtjFE',
  access_token_secret: 'L48tLAUaJ8FFikjgJHkQafQ2iHttXeOwuKEarnfT3vCsF'
});*/

var mysql = require('mysql')
var connection = mysql.createConnection({
	host     : 'stusql.dcs.shef.ac.uk',
	user     : 'acr16rm',
	password : '1c6c2403',
	database : 'acr16rm'
});
//		mysql -h stusql.dcs.shef.ac.uk -u acr16rm -p
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
			}
			querynew = querynew + 'from:' + who;
			////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			var team = queryInput.substring(queryInput.indexOf("AND")+10, queryInput.length-1);
			while(team.indexOf("\\\"")!=-1)
			{
				team = team.replace("\\\"", "");
			}
			querynew = querynew + ' ' + team;
			////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			var tweetpack = {"oldtweet": [], "newtweet": []};
			var queryID = '';
			var querylength = querynew.length;

			var currentDate = GetCurTime();
			var pastDate = minusDate(currentDate,7);

			querynew = querynew + " since:" + pastDate;

			var number =1;
			// Get id from database
			var idList = [];
			connection.query('select tweet_id from tweets', function(err, results, field) {
				if(err) throw err
					for (var i=0; i<results.length; i++) 
					{
			            var x = results[i];
			            idList.push(x['tweet_id'])
			        } 
				runQuery(querynew, querylength, queryID, tweetpack, number, res, pastDate, idList);
				//console.log(idList);
			});
			//console.log(idList);

			{
				//runQuery(querynew, querylength, queryID, tweetpack, number, res, pastDate);
			}
		});
	}
	else {
		file.serve(req, res, function (err, result) {
			if (err != null) {
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

function runQuery(querynew, querylength, queryID, tweetpack, number, res, pastDate, idList){
	var querydate = '';
	client.get('search/tweets', { q: querynew, count: 10}, function(err, data, response) {
		if (err) return console.error(err);
		for (var indx in data.statuses) 
		{
			var tweet= data.statuses[indx];
			queryID = tweet.id;

			var tweetObj = {
				"index": number,
				"tweetID": tweet.id_str,
				"date": tweet.created_at,
				"author": tweet.user.screen_name,
				"turl": 'http://twitter.com/'+tweet.user.screen_name+'/status/'+tweet.id_str,
				"uurl": 'http://twitter.com/'+tweet.user.screen_name,
				"content": tweet.text
			};

			querydate = tweet.created_at.substring(tweet.created_at.length-4, tweet.created_at.length) 
			+ '-'+ tweet.created_at.substring(4, 7) + '-'+ tweet.created_at.substring(8, 10);
			querydate = querydate.replace("Apr", "04");
			querydate = querydate.replace("May", "05");
			querydate = querydate.replace("Jun", "06");
			querydate = querydate.replace("Jul", "07");

			

			if(querydate<pastDate)
			{
				break;
			}
			else
			{
				connection.query('select tweet_id from tweets', function(err, results, field) {
				if(err) throw err
					for (var i=0; i<results.length; i++) 
					{
						if(idList.indexOf(tweet.id_str)==-1)
						{
							var x = results[i];
			            	idList.push(x['tweet_id']);
						}
			        }
			    });

				if(idList.indexOf(tweet.id_str)==-1)
				{
					tweetpack.newtweet.push(tweetObj);
					number++;
					var newtweet = tweet.text.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '');
					while(newtweet.indexOf("\"")!=-1)
					{
						newtweet = newtweet.replace("\"", "\'\'");
					}

					connection.query('insert into tweets value("'+tweet.user.screen_name+'","'+querydate+'","'+newtweet+'","'
						+tweet.url+'","'+'null'+'","'+tweet.id_str+'")', function(err, rows, field) {
							if(err) throw err
						});
					idList.push(tweet.id_str);
				}
				else
				{
					tweetpack.oldtweet.push(tweetObj);
					number++;
				}
				
			}
		}
		querynew = querynew.substring(0, querylength) + ' max_id:' + queryID;
		queryID = '';

		if(querydate>=pastDate)
		{
			runQuery(querynew, querylength, queryID, tweetpack, number, res, pastDate, idList);
		}
		if(querydate<pastDate)
		{
			res.writeHead(200, { "Content-Type": "application/json"});
			res.end(JSON.stringify(tweetpack));
		}
	})
};

function GetCurTime(){
	var d = new Date();
	var years = d.getFullYear();
	var month = add_zero(d.getMonth()+1);
	var days = add_zero(d.getDate());
	var ndate = years + "-" + month + "-" + days;
	return ndate;
}
function add_zero(temp){
	if(temp < 10) return "0" + temp;
	else return temp;
}
var n=1;
Date.prototype.minusDays = Date.prototype.minusDays || function(n) {
	this.setDate(this.getDate() - n);
	return this;
};
function minusDate(date,days){
	var d = new Date(date);
	d.setDate(d.getDate() - days);
	var m = add_zero(d.getMonth() + 1);
	return d.getFullYear() + "-" + m + "-" + add_zero(d.getDate());

}
/*
app.listen(3000, function() {
	console.log('Listening ar port 3000');
});*/