# Nexmo + Google Cloud Speech Transcription Demo

This is a demo applicaiton of using Google Cloud Speech API with Nexmo Websockets to perform realtime transcription in multiple languages.

## Prerequisites

### Google Cloud Speech API
1. Signup for the Speech API as part of Google Cloud: https://console.cloud.google.com/launcher/details/google/speech.googleapis.com
1. Once you have enabled the API, create a project and get a set of credentials downloaded as a JSON file. Save that file as `google_creds.json` in the root of the project.

### Nexmo
1. Create a Nexmo Voice Applicaiton with the answer url set to `[YOURHOSTNAME]/ncco` and optionally the event URL set to `[YOURHOSTNAME]/event`
1. Purchase a number and link it to the applicaiton, you can edit the number that is displayed on the webpage in `index.html` to match.


## Configuration
Apart from the Google credentials the only other parameter to configure is the hostname(s).

The server needs to listen on 2 separate TCP ports to expose a websocket server for the browser and for the nexmo voice API to connect to, the defaults for this are port `8000` and port `8001`.


Almost everything is on port `8000` apart from the nexmo websocket connection which uses `8001`, you can either run this server using ngrok and your local machine then expose each of the 2 ports under different hostnames or use the same hostname for the machine and just put `:8000` & `:8001` on the end of the hostnames. These are configured in the `.env` file.


## Running
1. To start the server run `node ./server.js`

1. You can then browse to the root of your hostname and the page should be served

1. Call the number linked to your applicaiton, enter the language code you want to test (e.g. 16 for UK English) and once the language has been confirmed to you start talking.

1. You will see transcription on the right hand side of the page.

