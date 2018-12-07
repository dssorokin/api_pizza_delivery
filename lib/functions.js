const crypto = require('crypto');
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

module.exports = {
    validateRequestFields,
    to,
    hash,
    parseJsonToObj
}
