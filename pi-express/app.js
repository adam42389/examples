const https = require('https');
const http = require('http');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const redirectToHTTPS = require('express-http-to-https').redirectToHTTPS
const api = require('./api/api.js');

const key = fs.readFileSync(`${process.env.HOME}/.ssh/serverkey.pem`);
const cert = fs.readFileSync(`${process.env.HOME}/.ssh/servercert.pem`);

const app = express();
const httpsServer = https.createServer({key: key, cert: cert }, app);
const httpServer = http.createServer(app);

app.use(redirectToHTTPS());
app.use(cors());
app.use(express.json({limit: '1mb'}));

app.use('/api/:group/:method', (req, res, next) => {
  api(req, res)
  .then(apiResponse => {
    res.json({status: 'success', response: apiResponse});
  })
  .catch(err => next(err)); 
});

app.use((err, req, res, next) => {
  res.json({status: 'error', message: err.message})
});

app.use(express.static('public'));
app.use((req, res) => {
  res.status(404).send('Not found.')
});

httpServer.listen(80);
httpsServer.listen(443);