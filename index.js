const http = require('http');
const https = require('https');
const url = require('url');
const querystring = require('querystring');
const fs = require('fs');
const { StringDecoder } = require('string_decoder');

const config = require('./config');
const router = require('./router');

const httpServer = http.createServer((req, res) => {
    unifiedServer(req, res); 
});

const httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOptions,  (req, res) => {
    unifiedServer(req, res); 
});

httpServer.listen(config.httpPort, () => {
    console.log(`The server is listening on ${config.httpPort} in ${config.name}.`);
});

httpsServer.listen(config.httpsPort, () => {
    console.log(`The server is listening on ${config.httpsPort} in ${config.name}.`);
});

const unifiedServer = async (req, res) => {
    const getDecoder = encoding => new StringDecoder(encoding);
    const getRouteHandler = (router, path) => 
        (data, callback) => typeof router[pathname] !== 'undefined' ? router[path](data, callback) : router.notfound(data, callback);
    const getHeaders = req => req.headers;
    const getMethod = req => req.method.toLowerCase();
    const getPathname = req => url.parse(req.url).pathname.replace(/^\/+|\/+$/g, '');
    const getQueryObj = req => querystring.parse(req.url);

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
        payload
    }

    choosenHandler(data, (statusCode = 200, payload = {}) => {
        const payloadStr = JSON.stringify(payload);

        res.setHeader('Content-Type', 'application/json');
        res.writeHead(statusCode);
        res.end(payloadStr);
        console.log('statusCode', statusCode);
        console.log('payload', payloadStr);
    });
}
