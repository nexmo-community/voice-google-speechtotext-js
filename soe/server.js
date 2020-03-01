'use strict';
require('dotenv').load();

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const expressWs = require('express-ws')(app);
const Nexmo = require('nexmo');
const { Readable } = require('stream');
const gSpeech = require('@google-cloud/speech');
const AssistantV2 = require('ibm-watson/assistant/v2');
const { IamAuthenticator } = require('ibm-watson/auth');
const gSTTclient = new gSpeech.SpeechClient(process.env.GOOGLE_APPLICATION_CREDENTIALS);
const assistant = new AssistantV2({
  version: '2020-02-05',
  authenticator: new IamAuthenticator({
    apikey: process.env.ASSISTANT_APIKEY
  })
});
const nexmo = new Nexmo({
  apiKey: process.env.NEXMO_API_KEY,
  apiSecret: process.env.NEXMO_API_SECRET,
  applicationId: process.env.NEXMO_APP_ID,
  privateKey: process.env.PRIVATE_KEY || './private.key'
});

let calls = nexmo.calls;
let talk = calls.talk;

app.use(bodyParser.json());

app.get('/ncco', (req, res) => {
  let nccoResponse = [{
    "action": "connect",
    "endpoint": [{
      "type": "websocket",
      "content-type": "audio/l16;rate=16000",
      "uri": `ws://${req.hostname}/socket`
    }]
  }];
  res.status(200).json(nccoResponse);
});

let caller = null;
let callUUID = null;
app.post('/event', (req, res) => {
  if (req.body.from !== 'Unknown') {
    caller = req.body.from;
    callUUID = req.body.uuid;
  }
  console.log('EVENT from', caller, 'to', req.body.to, req.body.status);
  // console.log('EVENT LOG::', req.body);
  res.status(204).end();
});

// Nexmo Websocket Handler
app.ws('/socket', (ws, req) => {

  let wSessionID = null;

  assistant.createSession({
    assistantId: process.env.WATSON_ASSISTANT_ID
  }).then(res => {
    wSessionID = res.result.session_id;
    // get watson to play welcome message to caller
    assistant.message({
      assistantId: process.env.WATSON_ASSISTANT_ID,
      sessionId: wSessionID,
      input: { 'text': 'Hello' }
    }).then(res => {
      // console.log(JSON.stringify(res, null, 2));
      console.log('Darcel:', res.result.output.generic[0].text);
      talk.start(callUUID, {
        text: res.result.output.generic[0].text
      }, (err, res) => { if (err) { console.error(err); } else { console.log(res); } });
    }).catch(err => { console.log(err); });
  }).catch(err => { console.log(err); });

  let gSTTparams = {
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: process.env.LANG_CODE || 'en-US'
    },
    interimResults: false
  };

  const recognizeStream = gSTTclient
    .streamingRecognize(gSTTparams)
    .on('error', console.error)
    .on('data', data => {
      console.log(`${caller}: ${data.results[0].alternatives[0].transcript}`);
      // and send to watson assistant
      assistant.message({
        assistantId: process.env.WATSON_ASSISTANT_ID,
        sessionId: wSessionID,
        input: { 'text': data.results[0].alternatives[0].transcript }
      }).then(res => {
        // console.log(JSON.stringify(res, null, 2));
        console.log('Darcel:', res.result.output.generic[0].text);
        talk.start(callUUID, {
          text: res.result.output.generic[0].text
        }, (err, res) => { if (err) { console.error(err); } else { console.log(res); } });
      }).catch(err => { console.log(err); });
    });

  ws.on('message', (msg) => {
    if (typeof msg === "string") {
      let config = JSON.parse(msg);
    } else {
      recognizeStream.write(msg);
    }
  });

  ws.on('close', () => {
    console.log('CALLER HUNG UP');
    recognizeStream.destroy();
  });
});

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
