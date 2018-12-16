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

const sendTwilioSms = async (phone, msg) => {
    phone = typeof phone === 'string' && phone.trim().length > 8 ? phone : null;
    msg = typeof msg === 'string' && msg.trim().length > 8 ? msg : null;

    if (!phone || !msg) {
        throw new Error('Given parameters are invalid or missed')
    }

    
}

module.exports = {
    validateRequestFields,
    to,
    hash,
    parseJsonToObj,
    createRandomString,
    updateObj
}
