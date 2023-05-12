const https = require('https');

let cachedQuote;
let cachedDate;

module.exports = {
    getMotivation: (req, res) => {
        // check if quote and date are already in cache
        const now = new Date();
        if (cachedQuote && cachedDate && cachedDate.getDate() === now.getDate()) {
            // if they are, render the cached quote
            res.render('daily-motivation', { quote: cachedQuote });
        } else {
            https.get('https://zenquotes.io/api/quotes/happiness', (resp) => {
                let data = '';
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                resp.on('end', () => {
                    // update cache with new quote and date
                    const newQuote = JSON.parse(data)[0];
                    cachedQuote = newQuote;
                    cachedDate = now;

                    // render the new quote
                    res.render('daily-motivation', { quote: newQuote });
                });
            }).on('error', (err) => {
                console.log('Error: ' + err.message);
            });
        }
    },
};