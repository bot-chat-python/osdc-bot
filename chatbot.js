var Faye = require('faye');
var request = require('request');
var config = require('./config');

var token   = config.token
var roomId  = config.roomId;

// Authentication extension

var ClientAuthExt = function() {};

ClientAuthExt.prototype.outgoing = function(message, callback) {
  if (message.channel == '/meta/handshake') {
    if (!message.ext) { message.ext = {}; }
    message.ext.token = token;
  }

  callback(message);
};

ClientAuthExt.prototype.incoming = function(message, callback) {
  if(message.channel == '/meta/handshake') {
    if(message.successful) {
      console.log('Successfuly subscribed to room: ', roomId);
    } else {
      console.log('Something went wrong: ', message.error);
    }
  }

  callback(message);
};


// Faye client

var client = new Faye.Client('https://ws.gitter.im/faye', {timeout: 60, retry: 5, interval: 1});

// Add Client Authentication extension
client.addExtension(new ClientAuthExt());

// A dummy handler to echo incoming messages
var messageHandler = function(msg) {
  if (msg.model && msg.model.fromUser) {
    console.log("Message: ", msg.model.text);
    console.log("From: ", msg.model.fromUser.displayName);

    reply_to_user(msg.model.fromUser, msg.model.text);
  }
};


function reply_to_user(user, message) {
  var displayName = user.displayName;
  var username = user.username;

  if (message.lastIndexOf("@osdc-bot") === 0) {
    var data = message.slice(10, message.length);
    if (data.lastIndexOf("help") === 0) {
      // list all commands
      console.log("[INFO] In help loop");
    }

    if (data.lastIndexOf("joke") === 0) {
      console.log("[INFO] In joke loop");
      send("@" + username + " Sorry, out of jokes for now!");
    }
  }
}


function send(message) {
  var body = {
    "text": message
  };

  request({
    url: "https://api.gitter.im/v1/rooms/"+ roomId + "/chatMessages",
    headers: {
      "Authorization" : "Bearer " + token
    },
    method: "POST",
    json: true,
    body: body, 
  }, function (error, response, body){
    console.log(response);
  });
}

client.subscribe('/api/v1/rooms/' + roomId + '/chatMessages', messageHandler, {});