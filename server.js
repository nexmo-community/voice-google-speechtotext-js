"use strict"; 
require('dotenv').load();

var http = require('http');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.server = http.createServer(app);
const expressWS = require('express-ws')(app, app.server);

app.use(express.static('files'))

const PORT = process.env.PORT || 8000;

app.use(bodyParser.json());

var WebSocketServer = require('websocket').server;
var url = require("url");

const fs = require('fs');

const Speech = require('@google-cloud/speech');

const speech = new Speech.SpeechClient();


// var clients = []


const Nexmo = require('nexmo');
const nexmo = new Nexmo({
  apiKey: "dummy",
  apiSecret: "dummy",
  applicationId: process.env.APP_ID,
  privateKey: "./private.key"
});

// var pagews = new WebSocketServer({
//     httpServer: app.server,
//     autoAcceptConnections: true,

// });

// Downsample frames from 16Khz to 8Khz
function convert(message){
    var arr = []
    var x = 0;
    var y;
    var i;
    for (i = 0; i < 160; i++) { 
        y = x+2
        arr.push(message.slice(x,y))
        x += 4;
    }
    var data = Buffer.concat(arr);
    return data
}
  
// Serve the  page
app.get("/", function(req, res) {
    fs.readFile('./index.html', function(error, data) {
       res.writeHead(200, { 'Content-Type': 'text/html' });
       res.end(data, 'utf-8');
    });
});

// Serve the langs 
app.get("/langs.json", function(req, res) {
    fs.readFile('./langs.json', function(error, data) {
       res.writeHead(200, { 'Content-Type': 'application/json' });
       res.end(data, 'utf-16');
    });
});



// Serve the 1st ncco
app.get("/ncco", function(req, res) {
    var parsedUrl = url.parse(req.url, true); // true to get query as object
    var params = parsedUrl.query;
    var ncco = require('./ncco_input.json');
    
    ncco[1].eventUrl[0] = "http://"+process.env.HOSTNAME+"/input?user=" + params.from
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(ncco), 'utf-8');
});


// Serve the 2nd ncco  based on input 
app.post("/input", function(req, res) {
    var params = req.body;
    var parsedUrl = url.parse(req.url, true); // true to get query as object
    var getparams = parsedUrl.query;
    var ncco = require('./ncco_websocket.json');
    var langs = require('./langs.json');
    var lang = langs.filter(function(l){
        return l.languageID == params.dtmf;
    });
    ncco[0].eventUrl[0] = "http://"+process.env.HOSTNAME+"/recording?from=" + getparams.user +"&langCode=" + lang[0].languageCode
    ncco[1].text = lang[0].languageName + ". Please share your message now.";
    ncco[2].endpoint[0].uri = "ws://"+ process.env.WSHOSTNAME + "/nexmosocket"
    ncco[2].endpoint[0].headers.languageCode = lang[0].languageCode
    ncco[2].endpoint[0].headers.user = getparams.user
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(ncco), 'utf-8');
});


// Receive Recording
app.post("/recording", function(req, res) {
    var parsedUrl = url.parse(req.url, true); // true to get query as object
    var getparams = parsedUrl.query;
    var params = req.body;
    console.log(req.body)
    var localfile = "files/"+params['conversation_uuid']+".wav"
    nexmo.files.save(params['recording_url'], localfile, (err, response) => {
      if(response) {
          console.log('The audio is downloaded successfully!');
          var response = {
                text: "http://"+process.env.HOSTNAME + "/" + localfile,
                languageCode: getparams.langCode,
                user: getparams.from
            }

        //   for (var i = 0; i < clients.length; i++) {
        //       clients[i].send(JSON.stringify(response))
        //   }
      }
    });
    res.writeHead(204);
    res.end();
});


// Log events
app.post("/event", function(req, res) {
       console.log(req.body)
       res.writeHead(204);
       res.end();
});

// Page Websocket Handler
// pagews.on('connect', function(connection) {
//     console.log((new Date()) + ' Connection accepted' + ' - Protocol Version ' + connection.webSocketVersion);
//     clients.push(connection);
//     connection.on('message', function(message) {
//         request.config.languageCode = message.utf8Data;
//     });
//     connection.on('close', function(reasonCode, description) {
//         console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
//         //remove the page from the list of clients
//         var index = clients.indexOf(connection);
//         if (index > -1) {
//             clients.splice(index, 1);
//         }
//     });
// });


// Nexmo Websocket Handler
app.ws('/nexmosocket', function(ws, req) {
    console.log('incoming to /nexmosocket');
    console.log((new Date()) + ' Connection accepted' + ' - Protocol Version ' + ws.webSocketVersion);
    // Create the stream at the start of the call
    console.log(ws);
    var recognizeStream = new RecognizeStream(ws);
});

class RecognizeStream {
    constructor(connection) {
        this.streamCreatedAt = null;
        this.stream = null;
        this.user = null    
        this.request = {
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 8000,
            languageCode: 'en-US' //Default Lang, will be updated with value from websocket
          },
          interimResults: false // If you want interim results, set this to true
        };
        connection.on('message', this.processMessage.bind(this));
        connection.on('close', this.close.bind(this));
    }
    
    processMessage(message){
        if (typeof message === 'string') {
            // Log the initial Message
            var data = JSON.parse(message)
            this.request.config.languageCode = data.languageCode
            this.user = data.user            
        }
        else if (typeof message === 'object') {
            // Convert to 8k then send to recogniser
            var data8000 = convert(message);
            this.getStream().write(data8000);
        }
        
    }

    
    close(){
        this.stream.destroy();
    }
    
    newStreamRequired() {
        // No stream exists
        if(!this.stream) {
            return true;
        }
        // check time since stream was created.  If 60+ seconds ago create a new stream
        else {
            const now = new Date();
            const timeSinceStreamCreated = (now - this.streamCreatedAt); // returns millis since stream created
            return (timeSinceStreamCreated/1000) > 60;
        }
    }
    
    // helper function to ensure we always get a stream object with enough time remaining to work with
    getStream() {
        if(this.newStreamRequired()) {
            if (this.stream){
                this.stream.destroy();
            }    
            this.streamCreatedAt = new Date();
            //console.log("Sending request as " + this.request.config.languageCode);
            this.stream = speech.streamingRecognize(this.request)
            .on('error', console.error)            
            .on('data', this.sendTranscription.bind(this));
        }
        return this.stream;
    }
    
    sendTranscription(data){
        console.log('received transcription')
        console.log(JSON.stringify(data, null, 2));

        var response = {
            text: data.results[0].alternatives[0].transcript,
            languageCode: this.request.config.languageCode,
            user: this.user
        }

        // for (var i = 0; i < clients.length; i++) {
        //     clients[i].send(JSON.stringify(response))
        // }
    }
}
      
//Start the server
app.server.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))
