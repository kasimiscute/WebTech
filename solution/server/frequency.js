 var express = require("express");
 var path = require('path');
 var fs = require('fs');
 var app = express();
 var bodyParser = require('body-parser');
 var utf = require('utf8');

 var Twit = require('twit');
 var client = new Twit({
  consumer_key: 'ZpWAwi7iJdurv8YzDdmdvBebQ',
  consumer_secret: 'h6HJecg5AKnzrtfLWVVzqoZ7DKjo3s2KTKz1xmWiYiIqM2ralV',
  access_token: '842778473454288896-cp8N3XoTQ9Kg1wEfKAOWARHBDeEtjFE',
  access_token_secret: 'L48tLAUaJ8FFikjgJHkQafQ2iHttXeOwuKEarnfT3vCsF'
});


//  search twitter for all tweets containing the word 'banana'
// since Nov. 11, 2011
app.use(bodyParser());

app.get('/', function(req, res) {
	res.sendFile('chart.html', {root: path.join(__dirname)});
});

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


app.post('/frequency',function(req,res){

res.writeHead(200, {"Content-Type": 'text/html', 'charset': 'utf-8'});
console.log(req.body.query);
var queryInput = JSON.stringify(req.body.query);

var currentDate = GetCurTime();
//for(var i=1; i<7;i++){
var pastDate = minusDate(currentDate,1);
var searchquery = queryInput +'since:'+ pastDate +' until:' + currentDate ;

  console.log('query:'+ searchquery);
  //a = b;
//}
var count=0;
var i=0;
{
  runQuery(queryInput,searchquery,currentDate,pastDate,count,i);
}
res.end();
});

function runQuery(queryInput,searchquery,currentDate,pastDate,count,i){
  i++;
  client.get('search/tweets', { q: searchquery, count: 100 },
              function(err, data, response) {
                if(err) return console.error(err);
                  for (var indx in data.statuses) {
                      var tweet= data.statuses[indx];
                      count++;
                  }
                    console.log('p:'+pastDate+'c'+currentDate+'count:'+ count);
                  currentDate = pastDate;
                  pastDate = minusDate(currentDate,1);
                  searchquery = queryInput +'since:'+ pastDate +' until:' + currentDate ;
                  count = 0;
                  if(i<8)
                  {
                    runQuery(queryInput,searchquery,currentDate,pastDate,count,i);
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
