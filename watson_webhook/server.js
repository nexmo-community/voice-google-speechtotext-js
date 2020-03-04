'use strict';
require('dotenv').config();

const algoliasearch = require("algoliasearch");
const express = require('express');
const bodyParser = require('body-parser');
const got = require('got');
const addDays = require('date-fns/addDays');
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
                    attributesToRetrieve: ['name', '_geoloc', 'schedule', 'resource_schedule']
                }).then(({ hits }) => {
                    hits.forEach(entry => {
                        if (entry.schedule.length === 0) {
                            entry.schedule = entry.resource_schedule;
                        }
                        delete entry['resource_schedule'];
                    });
                    res.json({ hits });
                });
                break;
            case 'read_list':
                let algoliaResults = await req.body.hits.hits;
                let formattedNameList = '';
                let i = 1;
                algoliaResults.forEach(singleResult => {
                    formattedNameList += ` ${i}. ` + singleResult.name + ',';
                    i++;
                });
                res.json({ string: formattedNameList });
                break;
            case 'get_details':
                let num = await req.body.result_number;
                let chosenResult = await req.body.algolia_results.hits[num - 1];
                let todayRaw = new Date();
                let weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                let today = weekday[todayRaw.getDay()];
                let tmrw = weekday[addDays(todayRaw, 1).getDay()];
                let formattedDetails = '';
                // find if has schedule
                if (chosenResult.schedule.length === 0) { // no open hours
                    formattedDetails = `${num}. ${chosenResult.name} does not have any in-person hours. `;
                } else {
                    // find if open today & tomorrow
                    let scheduleToday = false; let scheduleTmrw = false;
                    chosenResult.schedule.forEach(scheduleDay => {
                        if (scheduleDay.day === today) {
                            scheduleToday = scheduleDay;
                        };
                        if (scheduleDay.day === tmrw) {
                            scheduleTmrw = scheduleDay;
                        };
                    });
                    // format first part of string based on hours
                    formattedDetails = `${num}. ${chosenResult.name} `;
                    if (scheduleToday && scheduleTmrw) {
                        formattedDetails += `hours today, ${today}, are ${scheduleToday.opens_at} to ${scheduleToday.closes_at} . Tomorrow, ${tmrw}, they're open ${scheduleTmrw.opens_at} to ${scheduleTmrw.closes_at} . `;
                    } else if (!scheduleToday && scheduleTmrw) { // closed today, open tmrw
                        formattedDetails += `is closed today, but tomorrow, ${tmrw} , they're open ${scheduleTmrw.opens_at} to ${scheduleTmrw.closes_at} . `;
                    } else if (scheduleToday && !scheduleTmrw) { // closed tmrw, open today
                        formattedDetails += `hours today, ${today}, are ${scheduleToday.opens_at} to ${scheduleToday.closes_at} . They're closed tomorrow, ${tmrw} . `;
                    } else {
                        formattedDetails += `has hours, but is closed today and tomorrow. `;
                    }
                    // Optionally, add later:
                    // } else if () {
                    //     // open today but not open tomorrow so list 2nd day as after skipped ones
                    // } else if () {
                    //     // no hours today or tomorrow, next open after weekend or other skipped day
                    // }
                }
                // query google API for address from lat_lng and add to string if exists.
                // OPTIONALLY, INSTEAD, PULL THE FULL ADDRESS FROM ALGOLIA OR ASKDARCEL - it might be more accurate
                if (chosenResult._geoloc.lat) {
                    const body = await got(
                        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${chosenResult._geoloc.lat},${chosenResult._geoloc.lng}&result_type=street_address&key=${process.env.GOOGLE_API_KEY}`
                    ).json();
                    formattedDetails += `Their address is ${body.results[0].formatted_address}`;
                }
                res.json({ string: formattedDetails });
                break;
            case 'retrieve':
                // retrieve more details about a certain result from AskDarcel for texting the user
                break;
            case 'text':
                // text the user at the phone number they gave
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