#! /usr/bin/nodejs


var request = require('request')
  , JSONStream = require('JSONStream')
  , es = require('event-stream')
  , MongoClient = require('mongodb').MongoClient
  , Snoocore = require('snoocore');

var reddit = new Snoocore( {
  userAgent: 'rulers-breifs-bot v0.1 by super_jambo',
  throttle: 2000,
  login: {
    username: 'rulers-breifs',
    password: ''
  }
});

// get current pages
// check database for items
// if not in database create them.
// if not uploaded to reddit already upload them.
// mark uploaded
// replace "/" with "-" 
// and " " with "-" 

// options: 
// allow it to process all historic data? 

MongoClient.connect('mongodb://localhost:27017/rulers_breifs', 
  function(err, db) { 
    if(err) throw err;

    var breifings = db.collection('breifings');
    
    request({url: 'http://lda.data.parliament.uk/briefingpapers.json'})
      .pipe(JSONStream.parse('*.items.*'))
      .pipe(es.mapSync(function (data) {
        item = breifings.find({ref: data.identifier}).toArray(
                                function(err, results) { 
          if(err) { 
            console.error("error!: " + err);
          } 
          if(results.length == 0) {    
            console.log("New Unseen breifing: " + data.title);
            // post to reddit 
            // record that it's posted
          //insert({hello: 'world'}, {w:1}, function(err, objects) {
          }
        });
        return;
      }));
  }
); 

     //&& item.posted)
          // nothing to do here

  
      /*  console.log("-----------------------------");
        console.log("title: " + data.title);
        console.log("url: " + data._about);
        console.log("link: http://www.parliament.uk/briefing-papers/" + data.identifier.replace(/[ \/]/g, "-")); 
        console.log("link: http://www.parliament.uk/briefing-papers/" + data.identifier.replace(/[ \/]/g, "-") + ".pdf"); 
        console.log("id: " + data.identifier);
        console.log(data.description.join(" "));*/
        //console.log("title: " + data._about);
        //return data;
