# Google Cloud Speech Transcription Demo

This is a demo applicaiton of using Google Cloud Speech API with Nexmo Websockets to perform realtime transcription in multiple languages.

## Requirements
The application is built in node you will need the following packages:
* dotenv
* websocket
* httpdispatcher
* url
* @google-cloud/speech
* nexmo

These are all specified in the `package.json`

## Google Cloud Speech API
You'll need to signup for the Speech API as part of Google Cloud, start here https://console.cloud.google.com/launcher/details/google/speech.googleapis.com

Once you have enabled the API you'll need to create a project and get a set of credentials, these will be downloaded as a JSON file, same that file as `google_creds.json` in this project, (see the example file)


## Nexmo
You will need to create a Nexmo Voice Applicaiton with the answer url set to `[YOURHOSTNAME]/ncco` and optionally the event URL set to `[YOURHOSTNAME]/event`
You then need to purchase a number and link that to the applicaiton, you can edit the number that is displayed on the webpage in `index.html` to match your number.


## Configuration
Apart from the Google credentials the only other parameter to configur is the hostname(s) The server needs to listen on 2 separate TCP ports to expose a websocket server for the browser and for the nexmo voice API to connect to, the defaults for this are port 8000 and port 8001.
Almost everything is on port 8000 apart from the nexmo websocket connection which uses 8001, you can either run this server using ngrok and your local machine then expose each of the 2 ports under different hostnames or use the same hostname for the machine and just put `:8000` & `:8001` on the end of the hostnames.
These are configured in the `.env` file.


## Running
To start the server execute `node ./server.js`
You can then browse to the root of your hostname and the page should be served, call the number linked to your applicaiton, enter the language code you want to test (e.g. 16 for UK English) and once the language has been confirmed to you start talking. You will see transcription on the right hand side of the page.

