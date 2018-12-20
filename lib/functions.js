const crypto = require('crypto');
const https = require('https');
const http = require('http');
const querystring = require('querystring');
const config = require('../config');

const validateRequestFields = (payload, rules) =>
    Object.keys(payload).length &&
    Object.keys(payload).reduce(
        (acc, rule) => acc && 
            typeof payload[rule] === rules[rule].type &&
            (!rules[rule].minLength || payload[rule].length > rules[rule].minLength)
    );

const to = (promise) => 
    promise
        .then(data => [null, data])
        .catch(err => [err]);

const hash = password => typeof password === 'string' &&
    password.length > 0 &&
    crypto.createHmac('sha256', config.hashingSecret).update(password).digest('hex')

const parseJsonToObj = str => {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch(e) {
        return {};
    }
}

const createRandomString = (strLength) => {
    strLength = typeof strLength === 'number' && strLength > 0 ? strLength : false;

    if (!strLength) {
        return false;
    }

    const possibleCharacters = 'abcdefghijklmnopqrstuvwy123456789';
    let finalStr = '';

    for (let i = 0;i < strLength;i++) {
        const randomChar = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        finalStr += randomChar;
    }

    return finalStr;
}

const updateObj = (obj, data) => {
    const updatedObj = {};

    Object.keys(obj).forEach(key => {
        updatedObj[key] = data[key] ? data[key] : obj[key];
    })

    return updatedObj;
}

const request = (options, payload) => {
    const strPayload = payload ? querystring.stringify(payload) : null;
    options.headers = options.headers || {};
    if (strPayload) {
        options.headers['Content-Length'] = payload ? Buffer.byteLength(strPayload) : undefined;
    }

    return new Promise((resolve, reject) => {
        const moduleToUse = options.protocol.replace(':', '') === 'http' ? http : https;
        const req = moduleToUse.request(options, (res) => {
            resolve(res);     
        });

        req.on('error', err => {
            reject({
                type: 'req',
                error: err
            });
        });

        req.on('timeout', (err) => {
            reject({
                type: 'timeout',
                error: err
            })
        })

        if (strPayload) {
            req.write(strPayload);
        }

        req.end();
    });
}

const sendTwilioSms = async (phone, msg) => {
    phone = typeof phone === 'string' && phone.trim().length > 8 ? phone : null;
    msg = typeof msg === 'string' && msg.trim().length > 8 ? msg : null;

    if (!phone || !msg) {
        throw new Error('Given parameters are invalid or missed')
    }

    const payload = {
        'From': config.twilio.fromPhone,
        'To': '+7' + phone,
        'Body': msg
    };
    const reqOpts = {
        'protocol': 'https:',
        'hostname': 'api.twilio.com',
        'method': 'post',
        'path': '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
        'auth': config.twilio.accountSid + '.' + config.twilio.authToken,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    };

    const [err, res] = await to(request(reqOpts, payload));
    if (err) {
        throw err;
    }

    if (res.statusCode !== 200 && res.statusCode !== 201) {
        throw new Error('Status code was ' + res.statusCode);
    }

    
}

module.exports = {
    validateRequestFields,
    to,
    hash,
    parseJsonToObj,
    createRandomString,
    updateObj,
    sendTwilioSms,
    request
}
