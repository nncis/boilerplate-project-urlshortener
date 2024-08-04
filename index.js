require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const url = require('url');
const { MongoClient } = require('mongodb');
const dns = require("dns");


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

const mongoUri = process.env.MONGO_URI;

const client = new MongoClient(mongoUri);
const db = client.db('urlshortner');
const urls = db.collection("urls");

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  const bodyUrl = req.body.url;
  const parsedUrl = url.parse(bodyUrl, true).hostname;

  const dnsLookUp = dns.lookup(parsedUrl, async(err, address) => {
    if(!address){
      res.json({ error: 'Invalid URL'})
    } else {
      const urlCount = await urls.countDocuments({});

      const urlDoc = {
        url: bodyUrl,
        short_url: urlCount
      };

      const result = await urls.insertOne(urlDoc);
      const response = {
        original_url: bodyUrl,
        short_url: urlCount
      }
      res.json(response)

    }
  })

})

app.get('/api/shorturl/:shorturl', async (req, res) => {
  
  const shorturl = req.params.shorturl;
  const urlDoc = await urls.findOne({ short_url: +shorturl})
  res.redirect(urlDoc.url)
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
