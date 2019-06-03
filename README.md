# Nexmo + Google Cloud Speech Transcription Demo
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://nexmo.dev/google-nexmo-speechtotext-heroku)

You can use this code as a base for doing real time transcription of a phone call using Google Speech to Text API.

An audio stream is sent via websocket connection to your server and then relayed to the Google streaming interface. Speech recognition is performed and the text returned to the console.

## Google Speech to Text API
You will need to set up a [Google Cloud project and service account](https://cloud.google.com/speech-to-text/docs/quickstart-client-libraries). Once these steps are completed, you will have a downloaded JSON file to set up the rest of the project. You will need this file prior to using the `Deploy to Heroku` button. If you plan on running this locally, make sure this file is saved in the project folder.

## Running the App

### Running on Heroku

In order to run this on Heroku, you will need to gather the following information:

1. `API_KEY` - This is the API key from your Nexmo Account.
1. `API_SECRET` - This is the API secret from your Nexmo Account.
1. `GOOGLE_CLIENT_EMAIL` - You can find this in the `google_creds.json` file as `client_email`
1. `GOOGLE_PRIVATE_KEY` - You can find this in the `google_creds.json` file as `private_key`.
  1. Be sure to select everything as `-----BEGIN PRIVATE KEY-----\nXXXXXXXXX\n-----END PRIVATE KEY-----\n`

This will create a new Nexmo application and phone number to begin testing with. View the logs to see the transcription response from the service. You can do this in the Heroku dashboard, or with the Heroku CLI using `heroku logs -t`.

### Linking the app to Nexmo
You will need to create a new Nexmo application in order to work with this app:

#### Create a Nexmo Application Using the Command Line Interface

Install the CLI by following [these instructions](https://github.com/Nexmo/nexmo-cli#installation). Then create a new Nexmo application that also sets up your `answer_url` and `event_url` for the app running locally on your machine.

```
nexmo app:create google-speech-to-text http://<your_hostname>/ncco http://<your_hostname>/event
```

This will return an application ID. Make a note of it.

#### Buy a New Virtual Number
If you don't have a number already in place, you will need to buy one. This can also be achieved using the CLI by running this command:

```
nexmo number:buy
```

#### Link the Virtual Number to the Application
Finally, link your new number to the application you created by running:

```
nexmo link:app YOUR_NUMBER YOUR_APPLICATION_ID
```

### Local Install

To run this on your machine you'll need an up-to-date version of Node.

Start by installing the dependencies with:

```
npm install
```

Then copy the example.env file to a new file called .env:

```
cp .env.example > .env
```

Edit the .env file to add in your application ID and the location of the credentials file from Google.

```yaml
GOOGLE_APPLICATION_CREDENTIALS=./google_creds.json
APP_ID="12345678-aaaa-bbbb-4321-1234567890ab"
LANG_CODE="en-US"
```

Tools like [ngrok](https://ngrok.com/) are great for exposing ports on your local machine to the internet. If you haven't done this before, [check out this guide](https://www.nexmo.com/blog/2017/07/04/local-development-nexmo-ngrok-tunnel-dr/).

If you aren't going to be working in the en-US language then you can change the language to any of the other supported languages listed in the [Google Speech to Text API documentation](https://cloud.google.com/speech-to-text/docs/languages).

### Using Docker
To run the app using Docker run the following command in your terminal:

```
docker-compose up
```

This will create a new image with all the dependencies and run it at http://localhost:3000.
