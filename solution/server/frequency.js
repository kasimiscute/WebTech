 var express = require("express");
 var path = require('path');
 var fs = require('fs');
 //var app = express();
 var bodyParser = require('body-parser');
 var utf = require('utf8');
 var url = require('url');
 var protocol = require('http');
 var static = require('node-static');
 var util = require('util');
 var file = new (static.Server)();
 var portNo = 3000;

 var Twit = require('twit');
 var client = new Twit({
  consumer_key: 'ZpWAwi7iJdurv8YzDdmdvBebQ',
  consumer_secret: 'h6HJecg5AKnzrtfLWVVzqoZ7DKjo3s2KTKz1xmWiYiIqM2ralV',
  access_token: '842778473454288896-cp8N3XoTQ9Kg1wEfKAOWARHBDeEtjFE',
  access_token_secret: 'L48tLAUaJ8FFikjgJHkQafQ2iHttXeOwuKEarnfT3vCsF'
});

var datearray = new Array([]);

//  search twitter for all tweets containing the word 'banana'


var TEST_TABLE = 'datatest';


var mysql = require('mysql');
/*
var connection = mysql.createConnection({
  host     : 'localhost',
	user     : 'root',
	password : 'Mr123456',
	database : 'test',
  dateStrings: 'date',
});*/
var connection = mysql.createConnection({
  host     : 'stusql.dcs.shef.ac.uk',
  user     : 'acr16rm',
  password : '1c6c2403',
  database : 'acr16rm'
});
connection.connect();


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


var app = protocol.createServer(function (req, res) {
	var pathname = url.parse(req.url).pathname;
	var body = '';

	if ((req.method == 'POST') && (pathname == '/chart.html')) {
		var dataFin = {ok: 'ok'};
		req.on('data', function (data) {
			body += data;
		});

		req.on('end', function () {
			body= JSON.parse(body);


      var currentDate = GetCurTime();
      var endDate = minusDate(currentDate,7);
      console.log(currentDate);

      var datePack = {"date":[]};
      var frequencyPack = {"frequency" : []};
      var frquency = 0;
      var i = 0;

      drawChart(currentDate, endDate ,frequencyPack, frquency, res);
});
	}
	else {
		file.serve(req, res, function (err, result) {
			if (err !== null) {
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


function drawChart(currentDate,endDate,frequencyPack, frquency, res){
  var userGetSql =  'SELECT date from tweets where date = ?';
  var userGetSql_Params = [currentDate];
  var pastDate = minusDate(currentDate,1);
    connection.query(userGetSql,userGetSql_Params,function selectCb(error,results,fields){

    if(error) {console.log('[SELECT ERROR] - ',error.message);return;}
      if(results){
    if(currentDate >= endDate){
          frequency=0;
          for (var i=0; i<results.length; i++) {
              var firstResult = results[i];
              frequency++;
          }
          var frequencyObj = {
            "number": frequency,
            "currentDate": currentDate,
            "pastdate": pastDate,
          };

          frequencyPack.frequency.push(frequencyObj);

            currentDate = pastDate;
            pastDate = minusDate(currentDate,1);
            drawChart(currentDate,endDate,frequencyPack,frquency, res);
          }
    else{
            //console.log("results..................................");
            //console.log(frequencyPack);
            res.writeHead(200, { "Content-Type": "application/json"});
            res.end(JSON.stringify(frequencyPack));
            connection.end();
          }

      }

    });

}

app.listen(3000, function() {
	console.log('Listening ar port 3000');
});





/*client.get('search/tweets', { q: '@WayneRooney to Chelsea since:2011-10-11', count: 100 },
            function(err, data, response) {
                for (var indx in data.statuses) {
                    var tweet= data.statuses[indx];
                    console.log('on: ' + tweet.created_at + ' : @' + tweet.user.screen_name + ' : ' + tweet.text+'\n\n');
                }

            })*/
