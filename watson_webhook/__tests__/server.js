const axios = require('axios');
const main = require('../server');

describe('watson_webhook', () => {

    it('should receive HTTP POST requests at /api/watson_webhook', async () => {
        const server = main.startServer();

        const output = (await axios.post('http://729d6c00.ngrok.io/api/watson_webhook')).data;

        expect(output).toEqual({ success: true });

        main.killServer(server);
    });

    it.todo("When 'intent' is 'search', should query Algolia for a Service with Watson's parameters 'category' & 'neighborhood'");

    it.todo("When 'intent' is 'retrieve', should retreive Service details from AskDarcel for a service id");

});
