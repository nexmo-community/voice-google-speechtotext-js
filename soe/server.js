'use strict';
// load environment properties from a .env file for local development
require('dotenv').load();

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const expressWs = require('express-ws')(app);

const Nexmo = require('nexmo');
const { Readable } = require('stream');

const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
const { IamTokenManager } = require('ibm-watson/auth');

const speechToText = new SpeechToTextV1({
  authenticator: new IamAuthenticator({
    apikey: process.env.SPEECH_TO_TEXT_APIKEY,
  }),
  url: process.env.SPEECH_TO_TEXT_URL,
});

const speech = require('@google-cloud/speech');
// use GOOGLE_APPLICATION_CREDENTIALS to point to the info google-cloud/speech needs
const client = new speech.SpeechClient(null);

const nexmo = new Nexmo({
  apiKey: "dummy",
  apiSecret: "dummy",
  applicationId: process.env.APP_ID,
  privateKey: process.env.PRIVATE_KEY || './private.key'
});

app.use(bodyParser.json());

app.get('/ncco', (req, res) => {

  let nccoResponse = [
    {
      "action": "connect",
      "endpoint": [{
        "type": "websocket",
        "content-type": "audio/l16;rate=16000",
        "uri": `ws://${req.hostname}/socket`
      }]
    }
  ];

  res.status(200).json(nccoResponse);
});

app.post('/event', (req, res) => {
  console.log('EVENT LOG::', req.body);
  res.status(204).end();
});

// Nexmo Websocket Handler
app.ws('/socket', (ws, req) => {

  let request = {
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: process.env.LANG_CODE || 'en-US'
    },
    interimResults: false
  };

  const recognizeStream = client
    .streamingRecognize(request)
    .on('error', console.error)
    .on('data', data => {
      console.log(
        `Transcription: ${data.results[0].alternatives[0].transcript}`
      );
    });

  ws.on('message', (msg) => {
    if (typeof msg === "string") {
      let config = JSON.parse(msg);
    } else {
      recognizeStream.write(msg);
    }

  });

  ws.on('close', () => {
    recognizeStream.destroy();
  });
});

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
