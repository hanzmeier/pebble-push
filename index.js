var https = require('https');
var http = require('http');
var events = require('events');
var util = require('util');
var eventEmitter = new events.EventEmitter();

exports.handler = (event, context) => {

  try {

    if (event.session.new) {
      // New Session
      console.log("NEW SESSION")
    }

    switch (event.request.type) {

      case "LaunchRequest":
        // Launch Request
        console.log(`LAUNCH REQUEST`)
        context.succeed(
          generateResponse(
            buildSpeechletResponse("Welcome to Pebble Push, how may I help you?", false),
            {}
          )
        )
        break;

      case "IntentRequest":
        // Intent Request
        console.log(`INTENT REQUEST`)

        switch(event.request.intent.name) {
         case "normalReq":
            var reminder = event.request.intent.slots.Text.value;
            var date = event.request.intent.slots.Date.value;
            var time = event.request.intent.slots.Time.value;
            var username = event.session.user.userId;
            var formattedUsername = username.substring(18,28);
            var self;


            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth()+1; //January is 0!
            var yyyy = today.getFullYear();
            var hours = today.getHours();
            var mins = today.getMinutes();
            var secs = today.getSeconds();
            console.log(hours);
            if(dd<10) {
                dd='0'+dd
            } 
            if(mm<10) {
                mm='0'+mm
            } 
            today = yyyy+'-'+mm+'-'+dd;

            //Handling undefined scenarios
            if(reminder === undefined){
                reminder = "New Reminder";
            }
            if(date === undefined){
                date = today;
            }
            if(time === undefined){
                time = '12:00';
            }

            console.log(reminder);
            console.log(date);
            console.log(time);

            //BEGINNING OF EVENT MANAGER
            Eventer = function(){
				 events.EventEmitter.call(this);
            
            var query = '?q={"userId":"'+formattedUsername +'"}';
            var get_options = {
   					host: host,
   					path: '/rest/userinfo'+query,
   					method: 'GET',
   				headers: { 
                       'cache-control': 'no-cache',
                        'x-apikey': xapikey
                    }
			    };
                //GETTING INFO FROM DATABASE
                this.getInfo = function(){
                    self = this;
                    https.get(get_options, function(res){
                            console.log("STATUS: " +res.statusCode);
                                body = '';
                                res.on('data', function(chunk) {
                                    body += chunk;
                                });
                                res.on('end', function() {
                                    try {
                                        //Use Info Here
                                        var user = JSON.parse(body);
                                        var timelineID = user[0].timelineId;
                                        var timezone = user[0].timezone;
                                        self.emit('callPost', timelineID, timezone);
                            
                                    } catch (e) {
                                        console.log('Error parsing JSON!');
                                        context.succeed(
                                            generateResponse(
                                                buildSpeechletResponseAccount("Looks like you haven't linked your account yet. I've sent the link to do so in your Alexa App. For instructions and your ID, please say instructions now. Otherwise, say nevermind.", false),
                                                {}
                                            )
                                        )
                                    }	
                                })
                                res.on('error', function(e) {
                                console.log("Got error: " + e.message);
                         });
                    });
                }
            }
            util.inherits(Eventer, events.EventEmitter);

            Listener = function(){
        		this.callPost = function(timeline, tzone){
        			postInfo(timeline, tzone);
        		}
        	}
        	var eventer = new Eventer();
        	var listener = new Listener(eventer);
        	eventer.on('callPost', listener.callPost);
        	eventer.getInfo();

            //POSTING INFO TO TIMELINE
            postInfo = function(timeline, tzone){
                var timezone = tzone;
                var timelineID = timeline;
                var offset;

                switch(timezone){
                    case "EDT":
                        offset = "-04:00";
                        break;
                    case "CDT":
                        offset = "-05:00";
                        break;
                    case "MDT":
                        offset = "-06:00";
                        break;
                    case "PDT":
                        offset = "-07:00";
                        break;
                    case "AKDT":
                        offset = "-08:00";
                        break;
                    case "HST":
                        offset = "-10:00";
                        break;
                    default:
                        offset = "-04:00";
                        break;
                }

                var formattedTime = date+"T"+time+":00"+offset;
                var formattedReminder = capitalizeEachWord(reminder);
                var currentTime = hours+":"+mins+":"+secs;
                console.log(currentTime);
                var pinId = "pebblepush-"+formattedUsername+"-"+date+"-"+currentTime;

                var pin = {
                    "id": pinId,
                    "time": formattedTime,
                    "duration": 15,
                    "createNotification": {
                        "layout": {
                        "type": "genericNotification",
                        "title": "New Reminder",
                        "tinyIcon": "system://images/NOTIFICATION_LIGHTHOUSE",
                        "body": "PebblePush just added " + formattedReminder + " to your Timeline"
                        }
                    },
                    "reminders": [
                        {
                        "time": formattedTime,
                        "layout": {
                            "type": "genericReminder",
                            "tinyIcon": "system://images/NOTIFICATION_REMINDER",
                            "title": formattedReminder
                            }
                        }
                    ],
                    "layout": {
                        "type": "genericPin",
                        "title": formattedReminder,
                        "tinyIcon": "system://images/NOTIFICATION_REMINDER",
                        "body": "Created by PebblePush on Amazon Alexa"
                    }
                };

                var put_options = {
                    host: 'timeline-api.getpebble.com',
                    path: '/v1/user/pins/'+pinId,
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-Token': timelineID
                    }
                };

                put_req = https.request(put_options, function (res) {
                    console.log('STATUS: ' + res.statusCode);
                    console.log('HEADERS: ' + JSON.stringify(res.headers));
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        console.log('Response: ', chunk);
                        context.succeed(
                            generateResponse(
                                buildSpeechletResponse("I've sent the reminder " + reminder + " to your Timeline!", true),
                                {}
                            )
                        )
                    });
                });

                put_req.on('error', function(e) {
                    console.log('problem with request: ' + e.message);
                });
                console.log(JSON.stringify(pin));
                put_req.write(JSON.stringify(pin));
                put_req.end();

            }
            break;

        case "hoursReq":
            var reminder = event.request.intent.slots.Text.value;
            var username = event.session.user.userId;
            var formattedUsername = username.substring(18,28);
            var self;

            var hoursSlot = 1;
            if(!isNaN(event.request.intent.slots.Hours.value)){
                hoursSlot = event.request.intent.slots.Hours.value;
                console.log(hoursSlot);
            }

            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth()+1; //January is 0!
            var yyyy = today.getFullYear();
            var hours = today.getHours();
            var mins = today.getMinutes();
            var secs = today.getSeconds();

            if(dd<10) {
                dd='0'+dd
            } 
            if(mm<10) {
                mm='0'+mm
            } 
            if(hours < 10){
                hours = "0"+hours;
            }
            if(mins < 10){
                mins = "0"+mins;
            }
            if(hoursSlot < 10){
                hoursSlot = "0"+hoursSlot;
            }
            today = yyyy+'-'+mm+'-'+dd;

            //Handling undefined scenarios
            if(reminder === undefined){
                reminder = "New Reminder";
            }
            if(hoursSlot === undefined){
                hoursSlot === 1;
            }

            console.log(reminder);
            console.log(hoursSlot);

            //BEGINNING OF EVENT MANAGER
            Eventer = function(){
				 events.EventEmitter.call(this);
            
            var query = '?q={"userId":"'+formattedUsername +'"}';
            var get_options = {
   					host: host,
   					path: '/rest/userinfo'+query,
   					method: 'GET',
   				headers: { 
                       'cache-control': 'no-cache',
                        'x-apikey': xapikey
                    }
			    };
                //GETTING INFO FROM DATABASE
                this.getInfo = function(){
                    self = this;
                    https.get(get_options, function(res){
                            console.log("STATUS: " +res.statusCode);
                                body = '';
                                res.on('data', function(chunk) {
                                    body += chunk;
                                });
                                res.on('end', function() {
                                    try {
                                        //Use Info Here
                                        var user = JSON.parse(body);
                                        var timelineID = user[0].timelineId;
                                        var timezone = user[0].timezone;
                                        self.emit('callPost', timelineID, timezone);
                            
                                    } catch (e) {
                                        console.log('Error parsing JSON!');
                                        context.succeed(
                                            generateResponse(
                                                buildSpeechletResponseAccount("Looks like you haven't linked your account yet. I've sent the link to do so in your Alexa App. For instructions and your ID, please say instructions now. Otherwise, say nevermind.", false),
                                                {}
                                            )
                                        )
                                    }	
                                })
                                res.on('error', function(e) {
                                console.log("Got error: " + e.message);
                         });
                    });
                }
            }
            util.inherits(Eventer, events.EventEmitter);

            Listener = function(){
        		this.callPost = function(timeline, tzone){
        			postInfo(timeline, tzone);
        		}
        	}
        	var eventer = new Eventer();
        	var listener = new Listener(eventer);
        	eventer.on('callPost', listener.callPost);
        	eventer.getInfo();

            //POSTING INFO TO TIMELINE
            postInfo = function(timeline, tzone){
                var timezone = tzone;
                var timelineID = timeline;
                var offset;
                var offsetTemp;

                switch(timezone){
                    case "EDT":
                        offset = "-04:00";
                        break;
                    case "CDT":
                        offset = "-05:00";
                        break;
                    case "MDT":
                        offset = "-06:00";
                        break;
                    case "PDT":
                        offset = "-07:00";
                        break;
                    case "AKDT":
                        offset = "-08:00";
                        break;
                    case "HST":
                        offset = "-10:00";
                        break;
                    default:
                        offset = "-04:00";
                        break;
                }
                
                var currentTime = hours+":"+mins+":"+secs;
                var time = hours+":"+mins;
                var formattedHours = "-"+hoursSlot+":00";
                var formattedTime = today+"T"+time+":00"+formattedHours;
                var formattedReminder = capitalizeEachWord(reminder);
                console.log(currentTime);
                var pinId = "pebblepush-"+formattedUsername+"-"+today+"-"+currentTime;

                var pin = {
                    "id": pinId,
                    "time": formattedTime,
                    "duration": 15,
                    "createNotification": {
                        "layout": {
                        "type": "genericNotification",
                        "title": "New Reminder",
                        "tinyIcon": "system://images/NOTIFICATION_LIGHTHOUSE",
                        "body": "PebblePush just added " + formattedReminder + " to your Timeline"
                        }
                    },
                    "reminders": [
                        {
                        "time": formattedTime,
                        "layout": {
                            "type": "genericReminder",
                            "tinyIcon": "system://images/NOTIFICATION_REMINDER",
                            "title": formattedReminder
                            }
                        }
                    ],
                    "layout": {
                        "type": "genericPin",
                        "title": formattedReminder,
                        "tinyIcon": "system://images/NOTIFICATION_REMINDER",
                        "body": "Created by PebblePush on Amazon Alexa"
                    }
                };

                var put_options = {
                    host: 'timeline-api.getpebble.com',
                    path: '/v1/user/pins/'+pinId,
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-Token': timelineID
                    }
                };

                put_req = https.request(put_options, function (res) {
                    console.log('STATUS: ' + res.statusCode);
                    console.log('HEADERS: ' + JSON.stringify(res.headers));
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        console.log('Response: ', chunk);
                        context.succeed(
                            generateResponse(
                                buildSpeechletResponse("I've sent the reminder " + reminder + " to your Timeline!", true),
                                {}
                            )
                        )
                    });
                });

                put_req.on('error', function(e) {
                    console.log('problem with request: ' + e.message);
                });
                console.log(JSON.stringify(pin));
                put_req.write(JSON.stringify(pin));
                put_req.end();

            }
            break;

        case "instructions":
            console.log("INSTRUCTIONS REQUEST");
            var username = event.session.user.userId;
            var info = "Welcome to PebblePush! In a few short minutes you will be ready to send reminders directly to your watch! Just follow these short steps:"
                        +"\n- - -\n1) In the Pebble Appstore, download the 'Timeline Token' app. This app is required and must remain installed. Use this to get your Timeline Token"
                        +"\n2) Your Alexa ID can be found below. This and your Timeline Token from Step 2 will be used in Step 3"
                        +"\n3) Click the 'Link Account' button in your Alexa App and insert these values. If you don't see this card, please say 'ask Pebble Push to link account'. "
                        +" You can also do this step by visiting www.pebblepush.me"
                        +"\nYou are done! \n- - -\n**NOTE**: Pins can take some time to show up in your timeline. Do not rely on reminders any closer than 15min as Pebble cannot guarentee they will appear"
                        +"\n- - -\nAlexa ID:\n"
                        + username.substring(18,28);
            context.succeed(
                generateResponse(
                    buildSpeechletResponseCard("I've sent setup instructions to your Alexa App. Please follow them closely in order to ensure successful pairing.", "Setup Instructions", info, true),
                    {}
                )
            )
            break;
        
        case "linkaccount":
            console.log("LINK ACCOUNT REQUEST");
            context.succeed(
                generateResponse(
                    buildSpeechletResponseAccount("I've sent the button to link your account to your Alexa App.", true),
                    {}
                )
            )

         case "AMAZON.HelpIntent":
      	    console.log('HELP REQUEST');
      	    context.succeed(
                generateResponse(
                    buildSpeechletResponse('You can ask me to send a reminder to your Pebble Smartwatch with the reminder details, a date, and a time. For setup instructions, just say instructions. How may I help you?', false),
                    {}
                )
            )
        break;
        
        case "AMAZON.CancelIntent":
      	    console.log('HELP REQUEST');
      	    context.succeed(
                generateResponse(
                    buildSpeechletResponse('Thank you for using Pebble Push', true),
                    {}
                )
            )
        break;
        
        case "AMAZON.StopIntent":
      	    console.log('HELP REQUEST');
      	    context.succeed(
                generateResponse(
                    buildSpeechletResponse('Thank you for using Pebble Push', true),
                    {}
                )
            )
        break;

          default:
            throw "Invalid intent"
        }

        break;
    
    

      case "SessionEndedRequest":
        // Session Ended Request
        console.log('SESSION ENDED REQUEST')
        break;

      default:
        context.fail('INVALID REQUEST TYPE: ${event.request.type}')

    }

  } catch(error) { context.fail('Exception: '+error)}

}



// Helpers
buildSpeechletResponse = (outputText, shouldEndSession) => {

  return {
    outputSpeech: {
      type: "PlainText",
      text: outputText
    },
    shouldEndSession: shouldEndSession
  }

}
buildSpeechletResponseCard = (outputText, title, content, shouldEndSession) => {

  return {
    outputSpeech: {
      type: "PlainText",
      text: outputText
    },
    card: {
      type: "Simple",
      title: title,
      content: content
    },
    shouldEndSession: shouldEndSession
  }

}
buildSpeechletResponseAccount = (outputText, shouldEndSession) => {

  return {
    outputSpeech: {
      type: "PlainText",
      text: outputText
    },
    card: {
      type: "LinkAccount",
    },
    shouldEndSession: shouldEndSession
  }

}

generateResponse = (speechletResponse, sessionAttributes) => {

  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  }

}

function capitalizeEachWord(str) {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}