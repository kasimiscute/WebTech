//var express = require('express');
//var path = require('path');
//var fs = require('fs');
//var app = express();
//var bodyParser = require('body-parser');
//var utf = require('utf8');

//	Build basic frame
var protocol = require('http');
var static = require('node-static');
var url = require('url');
var util = require('util');
var file = new (static.Server)();

//	Import keyword-extractor
var keyword_extractor = require("keyword-extractor");

//	Twitter API
var Twit = require('twit');
var client = new Twit({
	consumer_key: '4KmRYi0xBi5ItjYZjBYKEupz8',
	consumer_secret: 'QHQpacx40n2r7Qqd2uyVXRcbxiUnwvVhcVlhNyc3QQ0R7EkwbH',
	access_token: '4735515988-qKjtBP2qHfgcML3moEsNyaUgGECzFzU1goLDkRF',
	access_token_secret: 'ivIC1P7aW9Kx4lmLQqst4Q6OPE32zh3xwrGDIz37ufnKj'
});
//	Backup Twitter API for rate limit
/*
var client = new Twit({
	consumer_key: 'ZpWAwi7iJdurv8YzDdmdvBebQ',
	consumer_secret: 'h6HJecg5AKnzrtfLWVVzqoZ7DKjo3s2KTKz1xmWiYiIqM2ralV',
	access_token: '842778473454288896-cp8N3XoTQ9Kg1wEfKAOWARHBDeEtjFE',
	access_token_secret: 'L48tLAUaJ8FFikjgJHkQafQ2iHttXeOwuKEarnfT3vCsF'
});*/

//	Database configuration
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

//	Main function which will receive request from web page
var app = protocol.createServer(function (req, res) {
	var pathname = url.parse(req.url).pathname;
	var body = '';

	//	The if function will check the request key word and call different function
	if ((req.method == 'POST') && (pathname == '/index.html')) {
		//	Functions for 1.1.1
		var dataFin = {ok: 'ok'};
		req.on('data', function (data) {
			body += data;
		});

		req.on('end', function () {
			//	Extract data from JSON which is sent from the web page
			body= JSON.parse(body);
			//	Extract original query
			var queryInput= body.query;
			var querynew = '';
			//	Extract the author data from the query
			var who = queryInput.substring(queryInput.indexOf("(")+1, queryInput.indexOf("AND")-2);
			//	Convert author date into the format that Twitter needs
			while(who.indexOf("\\\"")!=-1)	//	Check whether quotation mark exists
			{
				who = who.replace("\\\"", "");	//	Get rid of quotation marks
			}
			//	Check whether the author part is finished
			while(who.indexOf("OR")!=-1)
			{
				querynew = querynew + 'from:' + who.substring(0, who.indexOf("OR"))+ 'OR ';
				who = who.substring(who.indexOf(" ")+4, who.length);
			}
			// Add author part to the new query
			querynew = querynew + 'from:' + who;

			//	 Extract the team data from the query
			var team = queryInput.substring(queryInput.indexOf("AND")+10, queryInput.length-1);
			while(team.indexOf("\\\"")!=-1)
			{
				team = team.replace("\\\"", "");	//	Get rid of quotation marks
			}
			//	Add team part to the new query
			querynew = querynew + ' ' + team;

			//	Create a package to store data, which will be returned to the web page
			var tweetpack = {"oldtweet": [], "newtweet": []};
			var queryID = '';
			var querylength = querynew.length;

			// Get current date and the date which is seven days ago
			var currentDate = GetCurTime();
			var pastDate = minusDate(currentDate,7);
			// Add seven-day limit to the query
			querynew = querynew + " since:" + pastDate;

			var number =1;
			// Get ids from database
			var idList = [];
			connection.query('select tweet_id from tweets', function(err, results, field) {
				if(err) throw err
					for (var i=0; i<results.length; i++) 
					{
						// Add id to the id list
						var x = results[i];
						idList.push(x['tweet_id'])
					} 
					//	Call the function to fetch query
					runQuery(querynew, querylength, queryID, tweetpack, number, res, pastDate, idList);
				});
		});
	}
	else if ((req.method == 'POST') && (pathname == '/profile.html')) {
		//	Function for 1.1.3
		var dataFin = {ok: 'ok'};
		req.on('data', function (data) {
			body += data;
		});

		req.on('end', function () {
			body= JSON.parse(body);

			var querynew= body.profile;
			//	Create progile package to store data, which will be returned to the web page
			var profilepack = {
				"alltweet": [], 
				"url": [], 
				"fivetweet": [],
				"keyword": [],
				"wordnumber": [],
				"sevenkeyword": [],
				"sevenwordnumber": [],
				"geo": []
			};
			var queryID = '';
			var querylength = querynew.length;

			//	Get date information
			var currentDate = GetCurTime();
			var rounds = 0;
			var sevenDate = minusDate(currentDate,7);
			var fiveDate = minusDate(currentDate,5);

			//	Create keyword list
			var keywords = [];
			var number =1;
			//	Call the function to write the progile
			writeProfile(querynew, querylength, queryID, profilepack, number, res, sevenDate, fiveDate, rounds);
		});
	}
	else if ((req.method == 'POST') && (pathname == '/chart.html')) {
		//	 Function for 1.1.2
		var dataFin = {ok: 'ok'};
		req.on('data', function (data) {
			body += data;
		});

		req.on('end', function () {
			body= JSON.parse(body);

			// Get data information
			var currentDate = GetCurTime();
			var endDate = minusDate(currentDate,7);

			//	Create packages
			var datePack = {"date":[]};
			var frequencyPack = {"frequency" : []};
			var frquency = 0;
			var i = 0;
			//	Call the function to draw a chart
			drawChart(currentDate, endDate ,frequencyPack, frquency, res);
		});
	}
	else {
		//	If error shows up, alert the user
		file.serve(req, res, function (err, result) {
			//console.log(req.url);
			if (err != null) {
				console.error('Error serving %s - %s', req.url, err.message);
				if (err.status === 404 || err.status === 500) {
					file.serveFile(util.format('/../webapp/%d.html', err.status), err.status, {}, req, res);
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

//	Function to draw a chart
function drawChart(currentDate,endDate,frequencyPack, frquency, res){
	var userGetSql =  'SELECT date from tweets where date = ?';
	var userGetSql_Params = [currentDate];
	var pastDate = minusDate(currentDate,1);
	//	Extract data from database
	connection.query(userGetSql,userGetSql_Params,function selectCb(error,results,fields){
		if(error) {console.log('[SELECT ERROR] - ',error.message);return;}
		if(results){
			if(currentDate >= endDate){
				frequency=0;
				//	Get frequency
				for (var i=0; i<results.length; i++) {
					var firstResult = results[i];
					frequency++;
				}
				//	Create frequency object
				var frequencyObj = {
					"number": frequency,
					"currentDate": currentDate,
					"pastdate": pastDate,
				};
				//	Push objects into the package
				frequencyPack.frequency.push(frequencyObj);
				//	Change date
				currentDate = pastDate;
				pastDate = minusDate(currentDate,1);
				//	Run the function again
				drawChart(currentDate,endDate,frequencyPack,frquency, res);
			}
			else{
				//	End callbacks and return the package to the web page
				res.writeHead(200, { "Content-Type": "application/json"});
				res.end(JSON.stringify(frequencyPack));
				//	End database connection
				connection.end();
			}
		}
	});
}

//	Function to write a profile
function writeProfile(querynew, querylength, queryID, profilepack, number, res, sevenDate, fiveDate, rounds){
	var querydate = '';
	//	Fetch tweets from Twitter
	client.get('search/tweets', { q: querynew, count: 100}, function(err, data, response) {
		if (err) return console.error(err);
		for (var indx in data.statuses) 
		{
			var tweet= data.statuses[indx];
			queryID = tweet.id;

			//	COnver date format
			querydate = tweet.created_at.substring(tweet.created_at.length-4, tweet.created_at.length) 
			+ '-'+ tweet.created_at.substring(4, 7) + '-'+ tweet.created_at.substring(8, 10);
			querydate = querydate.replace("Jan", "01"); querydate = querydate.replace("Feb", "02");
			querydate = querydate.replace("Mar", "03"); querydate = querydate.replace("Apr", "04");
			querydate = querydate.replace("May", "05"); querydate = querydate.replace("Jun", "06");
			querydate = querydate.replace("Jul", "07"); querydate = querydate.replace("Aug", "08");
			querydate = querydate.replace("Sep", "09"); querydate = querydate.replace("Oct", "10");
			querydate = querydate.replace("Nov", "11"); querydate = querydate.replace("Dec", "12");

			//	Check whether the tweet has coordinates
			if(tweet.geo!=null)
			{
				//	Add coordinate into the array
				profilepack.geo.push(tweet.geo.coordinates);
			}

			//	Check whether the tweet has been added before
			if(profilepack.alltweet.indexOf(tweet.text)<0)	//	If the tweet is new, it's not in the array and the index is -1
			{
				profilepack.alltweet.push(tweet.text);
				profilepack.url.push('http://twitter.com/'+tweet.user.screen_name+'/status/'+tweet.id_str);
			}
			//	Check the date with five days ago
			if(querydate>fiveDate)
			{
				//	Add the tweet which is posted over the past five days
				profilepack.fivetweet.push(tweet.text);
			}
			//	Extract keywords with keyword-extractor
			newwords = keyword_extractor.extract(tweet.text,{
				language:"english",
				remove_digits: true,
				return_changed_case:true,
				remove_duplicates: false
			});
			//	Check the date with seven days ago
			if(querydate>sevenDate)
			{
				for(var x=0; x<newwords.length; x++)
				{
					//	Check whether the tweet has been added before
					if(profilepack.sevenkeyword.indexOf(newwords[x])<0)
					{
						//	If not, add the key word into the array and add a new counter in the nounter array
						profilepack.sevenkeyword.push(newwords[x]);
						profilepack.sevenwordnumber.push(1);
					}
					else
					{
						//	Otherwise, add one to the counter with the same index 
						profilepack.sevenwordnumber[x] += 1;
					}
				}
			}
			//	Same as the loop above, but this loop will extract all keywords until 
			for(var x=0; x<newwords.length; x++)
			{
				if(profilepack.keyword.indexOf(newwords[x])<0)
				{
					profilepack.keyword.push(newwords[x]);
					profilepack.wordnumber.push(1);
				}
				else
				{
					profilepack.wordnumber[x] += 1;
				}
			}
			
		}
		//	Update the query with tweet id to eliminate repetition
		querynew = querynew.substring(0, querylength) + ' max_id:' + queryID;
		queryID = '';
		number++;
		//	Set the limit
		if(rounds < 5)
		{
			rounds++;
			//	This part will fetch 500 tweets maximum
			if(rounds==5)
			{
				//	End the function and return the package to the web page
				res.writeHead(200, { "Content-Type": "application/json"});
				res.end(JSON.stringify(profilepack));
			}
			//	Call the function again
			writeProfile(querynew, querylength, queryID, profilepack, number, res, sevenDate, fiveDate, rounds);
		}
	})
};

//	Function to fetch tweets
function runQuery(querynew, querylength, queryID, tweetpack, number, res, pastDate, idList){
	var querydate = '';
	client.get('search/tweets', { q: querynew, count: 100}, function(err, data, response) {
		if (err) return console.error(err);
		//	Start a loop
		for (var indx in data.statuses) 
		{
			//	Fet tweet and its id
			var tweet= data.statuses[indx];
			queryID = tweet.id;
			//	Create tweet object with the infoamation that are required
			var tweetObj = {
				"index": number,
				"tweetID": tweet.id_str,
				"date": tweet.created_at,
				"author": tweet.user.screen_name,
				"turl": 'http://twitter.com/'+tweet.user.screen_name+'/status/'+tweet.id_str,	//	Link to the tweet which is generated manually
				"uurl": 'http://twitter.com/'+tweet.user.screen_name,	//	Link to the author page which is generated manually
				"content": tweet.text
			};

			//	Convert date format
			querydate = tweet.created_at.substring(tweet.created_at.length-4, tweet.created_at.length) 
			+ '-'+ tweet.created_at.substring(4, 7) + '-'+ tweet.created_at.substring(8, 10);
			querydate = querydate.replace("Jan", "01"); querydate = querydate.replace("Feb", "02");
			querydate = querydate.replace("Mar", "03"); querydate = querydate.replace("Apr", "04");
			querydate = querydate.replace("May", "05"); querydate = querydate.replace("Jun", "06");
			querydate = querydate.replace("Jul", "07"); querydate = querydate.replace("Aug", "08");
			querydate = querydate.replace("Sep", "09"); querydate = querydate.replace("Oct", "10");
			querydate = querydate.replace("Nov", "11"); querydate = querydate.replace("Dec", "12");

			if(querydate<pastDate)
			{
				//	If the tweet was posted earlier than seven days ago, stop the loop
				break;
			}
			else
			{
				//	Extract tweet id from database
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
				//	Check whether the tweet has been added in the previous queries
				if(idList.indexOf(tweet.id_str)==-1)
				{
					//	New tweets will be pushed into the new tweet array
					tweetpack.newtweet.push(tweetObj);
					number++;
					//	Elimiate characters which can't be stored into the database
					var newtweet = tweet.text.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '');
					//	Get rid of the quotation marks, or the insert command will be stopped
					while(newtweet.indexOf("\"")!=-1)
					{
						newtweet = newtweet.replace("\"", "\'\'");
					}
					//	Insert new tweets into the database
					connection.query('insert into tweets value("'+tweet.user.screen_name+'","'+querydate+'","'
						+newtweet+'", "http://twitter.com/'+tweet.user.screen_name+'/status/'+tweet.id_str
						+'","http://twitter.com/'+tweet.user.screen_name+'","'+tweet.id_str+'")', function(err, rows, field) {
							if(err) throw err
						});
					//	Add id into id list to eliminate repetition
					idList.push(tweet.id_str);
				}
				else
				{
					//	Old tweet won't be added to the database and will be added to the old tweet array
					tweetpack.oldtweet.push(tweetObj);
					number++;
				}				
			}
		}
		//	Update query with tweet id to eliminate repetition
		querynew = querynew.substring(0, querylength) + ' max_id:' + queryID;
		queryID = '';
		//	Check whether the tweet was posted earlier than seven days ago
		if(querydate>=pastDate)
		{
			//	If not, run the query again
			runQuery(querynew, querylength, queryID, tweetpack, number, res, pastDate, idList);
			//console.log(number);
		}
		if(querydate<pastDate)
		{
			//	Otherwise, stop the query and returned the package to the web page
			res.writeHead(200, { "Content-Type": "application/json"});
			res.end(JSON.stringify(tweetpack));
		}
	})
};

//	Functions to get current date and modify the date
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