#! /usr/bin/nodejs


var request = require('request')
  , JSONStream = require('JSONStream')
  , es = require('event-stream')
  , MongoClient = require('mongodb').MongoClient
  , Snoocore = require('snoocore')
  , ProcessArgs = require('minimist');

args = ProcessArgs(process.argv.slice(2));
if(args.u == undefined || args.p == undefined || args.k == undefined ||
   args.s == undefined)
{
  console.error("Missing argument, must have: u, p, k & s " +
                "(user, password, key & secret)");
  process.exit(1);
}
// kill the process after 5 minutes.
setTimeout( function() {
  process.exit(0);
}, 300000);

var reddit = new Snoocore( {
  userAgent: 'rulers-breifs-bot v0.1 by super_jambo',
  throttle: 2000,
  login: {
    username: args.u,
    password: args.p,
  }
,
  oauth: {
        type: 'script',
        consumerKey: args.k,
        consumerSecret: args.s,
        scope: [ 'flair', 'identity', 'submit' ] // make sure to set all the scopes you need.
  }
});

reddit.auth().then ( function(login_data) {
reddit('/api/v1/me').get().then( function(my_data) {
  console.log(my_data);

MongoClient.connect('mongodb://localhost:27017/rulers_briefs',
  function(err, db) {
    if(err) throw err;

    var briefings = db.collection('briefings');

    request({url: 'http://lda.data.parliament.uk/briefingpapers.json'})
      .pipe(JSONStream.parse('*.items.*'))
      .pipe(es.mapSync(function (briefing_data) {
        item = briefings.find({ref: briefing_data.identifier}).toArray(
                                function(err, results) {
          if(err) {
            console.error("error!: " + err);
          }
          if(results.length == 0) {
            console.log("New briefing: " + briefing_data.title);
            var briefing_json = "[___PDF___](http://www.parliament.uk" +
                    "/briefing-papers/" +
                    briefing_data.identifier.replace(/[ \/]/g, "-") + ".pdf)"+
            "  --  [___link___](http://www.parliament.uk" +
                    "/briefing-papers/" +
                    briefing_data.identifier.replace(/[ \/]/g, "-") +")"+
                    "\n\n\n"+briefing_data.description.join(" ");

            reddit('/api/submit').post({
              title: briefing_data.title,
              text: briefing_json,
              sr: 'ukgovbriefs',
              kind: 'self',
              //kind: 'text', //intentional bug to test stuff without posting
              api_type: 'json'
            }).then( function (response) {
              if(response && response.json && response.json.errors &&
                 response.json.errors.length == 0 && response.json.data &&
                 response.json.data.id) {
                briefings.insert({ref: briefing_data.identifier,
                  url: briefing_data._about,
                  title: briefing_data.title}, {w:1},
                 function(err, objects) {
                    console.log("Posted & recorded: "+briefing_data.title+" @"+
                        response.json.data.url);
                    if(err) throw err;
                 });
              }

            }, function (err) {console.error("ERROR: " + err);} );
          } else {
            console.log("Already posted: " + briefing_data.title);
          }
        });
        return;
      }));
  }
);

}, function(error) {
  console.log("Reddit error: " + error);

}); //close reddit me query

}, function(error) {
  console.log("Reddit error: " + error);
}); // close reddit login
