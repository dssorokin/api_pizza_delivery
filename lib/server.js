const http = require('http');
const https = require('https');
const url = require('url');
const querystring = require('querystring');
const fs = require('fs');
const { StringDecoder } = require('string_decoder');

const config = require('../config');
const router = require('./router');
const path = require('path');
const { parseJsonToObj, sendTwilioSms } = require('./functions');
const util = require('util');
const debuglog = util.debuglog('server');

// sendTwilioSms('9157567051', 'Hello world!')
//     .then(() => console.log('Message has sent'))
//     .catch(err => console.log('error', err))

const server = {};

server.httpServer = http.createServer((req, res) => {
    server.unifiedServer(req, res); 
});

server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};
server.httpsServer = https.createServer(server.httpsServerOptions,  (req, res) => {
    server.unifiedServer(req, res);
});

server.unifiedServer = async (req, res) => {
    const getDecoder = encoding => new StringDecoder(encoding);
    const getRouteHandler = (router, path) => 
        (data, callback) => typeof router[path] !== 'undefined' ? router[path](data, callback) : router.notfound(data, callback);
    const getHeaders = req => req.headers;
    const getMethod = req => req.method.toLowerCase();
    const getPathname = req => url.parse(req.url).pathname.replace(/^\/+|\/+$/g, '');
    const getQueryObj = req => querystring.parse(url.parse(req.url).query);

    const pathname = getPathname(req);
    const queryParsed = getQueryObj(req);
    const headers = getHeaders(req);
    const method = getMethod(req);


    const fetchPayload = req => new Promise((resolve, reject) => {
        const decoder = getDecoder('utf-8');

        let payload = '';

        req.on('data', (data) => {
            payload += decoder.write(data);
        });

        req.on('error', () => {
            reject('Wrong chunk of data');
        });

        req.on('end', () => {
            payload += decoder.end();
            resolve(payload);
        })
    });

    const payload = await fetchPayload(req);
    const choosenHandler = getRouteHandler(router, pathname);
    const data = {
        pathname,
        queryParsed,
        method,
        headers,
        payload: parseJsonToObj(payload)
    }

    choosenHandler(data, (statusCode = 200, payload = {}) => {
        const payloadStr = JSON.stringify(payload);

        res.setHeader('Content-Type', 'application/json');
        res.writeHead(statusCode);
        res.end(payloadStr);
        if (statusCode !== 200) {
            debuglog('\x1b[31m%s\x1b[0m', statusCode);
        } else {
            debuglog('\x1b[32m%s\x1b[0m', statusCode);
        }
    });
}

server.init = function() {
    server.httpServer.listen(config.httpPort, () => {
        console.log('\x1b[36m%s\x1b[0m', `The server is listening on ${config.httpPort} in ${config.name}.`)
    });
    
    server.httpsServer.listen(config.httpsPort, () => {
        console.log('\x1b[35m%s\x1b[0m', `The server is listening on ${config.httpsPort} in ${config.name}.`)
    });
}

module.exports = server;
