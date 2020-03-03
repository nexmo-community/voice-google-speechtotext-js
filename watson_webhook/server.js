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
        switch (req.body.intent) {
            case 'neighborhood':
                const body = await got(
                    `https://maps.googleapis.com/maps/api/geocode/json?address=${req.body.neighborhood}%20San%20Francisco&key=${process.env.GOOGLE_API_KEY}`
                ).json();
                // console.log(body.results[0].geometry.location);
                res.json(body.results[0].geometry.location);
                break;
            case 'search':
                index.search(req.body.category, {
                    aroundLatLng: `${req.body.lat_lng.lat}, ${req.body.lat_lng.lng}`,
                    hitsPerPage: 6,
                    attributesToHighlight: [],
                    attributesToRetrieve: ['name', '_geoloc']
                }).then(({ hits }) => {
                    // console.log(hits.length, hits);
                    res.json({ hits });
                });
                break;
            case 'read_list':
                let algoliaResults = await req.body.hits.hits;
                console.log(req.body.hits.hits);
                let formattedNameString = '';
                let i = 1;
                algoliaResults.forEach(singleResult => {
                    formattedNameString += ` ${i}. ` + singleResult.name + ',';
                    i++;
                });
                console.log(formattedNameString);
                res.json({ string: formattedNameString });

            // let algoliaResult = await req.body.hits[number].name;
            // console.log(algoliaResult);
            // res.json({ name: algoliaResult });
            case 'retrieve':
                //retrieve more details from AskDarcel for the given Service
                break;

            default:
                break;
        }
    });
    app.listen(port, () => console.log(`Example app listening on port ${port}!`));
};

const killServer = (server) => {
    server.removeAllListeners();
};

module.exports = {
    startServer,
    killServer
};

startServer();