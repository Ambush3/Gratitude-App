const https = require('https');

module.exports = {
    getMotivation: (req, res) => {
        // get api data from https://zenquotes.io/api/quotes/happiness
        // use in daily-motivation.ejs
        // res.render('daily-motivation', {motivation: motivation});
        https.get('https://zenquotes.io/api/quotes/happiness', (resp) => {
            let data = '';
            // A chunk of data has been received.
            resp.on('data', (chunk) => {
                data += chunk;
            });
            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                // render into daily-motivation.ejs into <p><%= quote.h %></p> and <p><%= quote.a %></p>
                res.render('daily-motivation', {quote: JSON.parse(data)[0]});
            });
        }
        ).on("error", (err) => {

            console.log("Error: " + err.message);

        // the response format
        // q = quote text
        // a = author name
        // i = author image (key required)
        // c = character count
        // h = pre-formatted HTML quote

    });
    }
}