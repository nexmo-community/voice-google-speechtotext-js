'use strict';
require('dotenv').config();

const algoliasearch = require("algoliasearch");
const express = require('express');
const bodyParser = require('body-parser');
const got = require('got');
const app = express();
const index = algoliasearch(
    process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_SEARCH_KEY
).initIndex(process.env.ALGOLIA_INDEX);
const port = 5000;

app.use(bodyParser.json());

const startServer = () => {
    app.post('/api/watson_webhook', async (req, res) => {
        console.log(req.body);
        switch (req.body.intent) {
            case 'neighborhood':
                const body = await got(
                    `https://maps.googleapis.com/maps/api/geocode/json?address=${req.body.neighborhood}%20San%20Francisco&key=${process.env.GOOGLE_API_KEY}`
                ).json();
                res.json(body.results[0].geometry.location);
                break;
            case 'search':
                index.search(req.body.category, {
                    aroundLatLng: `${req.body.lat_lng.lat}, ${req.body.lat_lng.lng}`,
                    hitsPerPage: 6,
                    attributesToHighlight: [],
                    attributesToRetrieve: ['name', '_geoloc']
                }).then(({ hits }) => {
                    res.json({ hits });
                });
                break;
            case 'read_list':
                let algoliaResults = await req.body.hits.hits;
                let formattedNameString = '';
                let i = 1;
                algoliaResults.forEach(singleResult => {
                    formattedNameString += ` ${i}. ` + singleResult.name + ',';
                    i++;
                });
                res.json({ string: formattedNameString });
                break;
            case 'retrieve':
                //retrieve more details from AskDarcel for the given Service
                break;
            default:
                let e = "case not found, please include a valid value for the 'intent' key in the json parameters";
                console.error(e);
                res.status(404).json({ error: e });
                break;
        }
    });
    app.listen(port, () => console.log(`watson_webhook listening on port ${port}!`));
};

const killServer = (server) => {
    server.removeAllListeners();
};

module.exports = {
    startServer,
    killServer
};

startServer();