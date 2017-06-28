console.log('The bot is working');

//packages needed
var Twit = require('twit');
var config = require('./config');
var fs = require('fs');
var request = require('request');
var http = require('http');

//global variables
var url = "https://www.reddit.com/r/reddevils/top.json?sort=top&t=hour&limit=1";
var permalink = '';
var T = new Twit(config);
var stream = T.stream('user');

//streams
//stream.on('follow', followed);
stream.on('tweet', replyToTweet)

//makeMediaPost test variables
var filename = "../images/gort.jpg";
var msg = "This picture is so good, I will post it twice! #Gort";
//makeMediaPost(filename, msg);

redditRequest();

function replyToTweet(event) {
  var replyTo = event.in_reply_to_screen_name;
  var text = event.text;
  var from = event.user.screen_name;
  var fromTweet = event.text;
  var fromTweetLwrcse = fromTweet.toLowerCase();
  var tweetID = event.id_str;

  var randNumChecker = fromTweetLwrcse.search("random") != -1 && fromTweetLwrcse.search("number") != -1;

  if (replyTo == "reddevilsbot" || text.search("@reddevilsbot") != -1) {
    if (randNumChecker) {
      var number = Math.round(Math.random() * 100);
      var tweetMsg = '@' + from + ' ' + number;
      var newTweet = {
        status: tweetMsg,
        in_reply_to_status_id: tweetID
      }
      T.post('statuses/update', newTweet, tweeted);
    } else {
      var tweetMsg = '@' + from + ' Thanks for tweeting me!'
      var newTweet = {
        status: tweetMsg,
        in_reply_to_status_id: tweetID
      }
      T.post('statuses/update', newTweet, tweeted);
    }
  }
}

function makeMediaPost(filename, msg) {
  var params = {
    encoding: "base64"
  };
  var b64 = fs.readFileSync(filename, params);

  T.post('media/upload', {
    media_data: b64
  }, uploaded);

  function uploaded(err, data, response) {
    var id = data.media_id_string;
    var media_tweet = {
      status: msg,
      media_ids: [id]
    }

    T.post('statuses/update', media_tweet, tweeted);
  }
}

function followed(event) {
  var name = event.source.name;
  var handle = event.source.screen_name;

  console.log('I have been followed!');

  var followTweet = 'Thanks for following me @' + handle + '!';
  tweetIt(followTweet);
}

function tweetIt(input) {
  var tweet = {
    status: input
  };

  T.post('statuses/update', tweet, tweeted);
}

function tweeted(err, data, response) {
  if (err) {
    console.log('Not working');
    console.log(err);
  } else {
    console.log('It worked!');
  }
}

function hourlyTweet(permalink, title){
  console.log('perma ', permalink);
  var reddevilsTweet = "Title: \"" + title + "\" \n " +
  "reddit.com" + permalink;
  tweetIt(reddevilsTweet);
}

function redditRequest(){
  request(url, function(error, response, body) {
    var redditResponse = JSON.parse(body);
    if(redditResponse.data.children.length > 0){
      permalink = redditResponse.data.children[0].data.permalink;
      var permaString = permalink.toString();
      var title = redditResponse.data.children[0].data.title.toString();
      console.log(permaString, title);
      hourlyTweet(permaString, title);
    } else {
      var newURL = "https://www.reddit.com/r/reddevils/new.json?limit=1";
      request(newURL, function(newError, newResponse, newBody){
        var newRedditResponse = JSON.parse(newBody);
        var newPermalink = newRedditResponse.data.children[0].data.permalink.toString();
        var newTitle = newRedditResponse.data.children[0].data.title.toString();
        hourlyTweet(newPermalink, newTitle);
      });
    }

    setInterval(redditRequest, 1000*60*60);
  });
}
