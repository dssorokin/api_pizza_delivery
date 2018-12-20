const path = require('path');
const fs = require('fs');

const lib = require('./data');
const _logs = require('./logs');
const http = require('http');
const https = require('https');
const { to, request, sendTwilioSms } = require('./functions');
const url = require('url');

const workers = {};

workers.gatherAllChecks = async function() {
    const [err, checks] = await to(lib.list('checks'));
    if (err) {
        console.log('Could not find any checks')
        return;
    }

    checks.forEach(async (check) => {
        const [err, checkData] = await to(lib.read('checks', check));
        if (err) {
            console.log('Could not read data');
        }

        workers.validateCheckData(checkData)
    });
}

workers.validateCheckData = function(checkData) {
    checkData = typeof checkData === 'object' && checkData !== null ? checkData : null;
    let { 
        id, userPhone, protocol, 
        url, successCodes, timeoutSeconds,
        state, lastChecked, method
    } = checkData;
    id = typeof id === 'string' && id.length === 20 ? id.trim() : null;
    userPhone = typeof userPhone === 'string' && userPhone.length > 8 ? userPhone.trim() : null;
    protocol = typeof protocol === 'string' && ['http', 'https'].indexOf(protocol) > -1 ? protocol.trim() : null;
    url = typeof url === 'string' ? url.trim() : null;
    method = typeof method === 'string' && ['post', 'get', 'delete', 'put'].indexOf(method) > -1 ? method.trim() : null;
    successCodes = successCodes instanceof Array && successCodes.length > 0 ? successCodes : null;
    timeoutSeconds = typeof timeoutSeconds === 'number' && timeoutSeconds >= 1 ? timeoutSeconds : null;

    state = typeof state === 'boolean' && state;
    lastChecked = typeof lastChecked === 'number' && lastChecked > 0 ? lastChecked : null;


    if (!protocol || !url || !method || !successCodes || !timeoutSeconds) {
        console.log('One of the checks is not properly formatted');
        return;
    }

    workers.performCheck({
        id, userPhone, protocol,
        url, method, successCodes, state,
        lastChecked, timeoutSeconds
    })


}

workers.performCheck = async function(checkData) {
    let err, urlResponse;
    let { protocol, url, method, timeoutSeconds } = checkData;
    protocol += ':';
    method = method.toUpperCase();
    const checkOutcome = {
        error: false,
        responseCode: false
    };

    const urlParsed = new URL(`${protocol}//${url}`);
    let { hostname, path } = urlParsed;

    const requestOptions = {
        protocol,hostname, path,
        method,
        timeout: timeoutSeconds * 1000
    };

    [err, urlResponse] = await to(request(requestOptions));

    if (err) {
        checkOutcome.error = err;
        workers.processCheckOutcome(checkData, checkOutcome);
        return;
    }

    checkOutcome.responseCode = urlResponse.statusCode;
    workers.processCheckOutcome(checkData, checkOutcome);
}

workers.processCheckOutcome = async function(checkData, checkOutcome) {
    let err;
    let { successCodes, lastChecked, state, userPhone, protocol, url } = checkData;
    const { error, responseCode } = checkOutcome;
    let newState = !error && responseCode && successCodes.includes(responseCode);
    let alertWanted = lastChecked && newState !== state;

    state = newState;
    lastChecked = Date.now();
    const newCheckData = { ...checkData, lastChecked, state };

    workers.log(checkData, checkOutcome, state, alertWanted, lastChecked);

    [err] = await to(lib.update('checks', newCheckData.id, newCheckData));
    if (err) {
        console.log('check was not updated');
    }

    if (!alertWanted) {
        console.log('check outcome was not changes');
        return;
    }

    [err] = await to(sendTwilioSms(userPhone, `Your check for ${protocol}://${url} is currently ${state ? 'up' : 'down'}`));
    if (err) {
        console.log('Sms was not send to user')
        return;
    }

    console.log('Notification about status changed was sent to user')
}

workers.log = async function(checkData, checkOutcome, state, alertWanted, lastChecked) {
    let err;
    const logData = {
        checkData, checkOutcome,
        state, alert: alertWanted, time: lastChecked
    };

    const logString = JSON.stringify(logData);

    const logFileName = checkData.id;

    [err] = await to(_logs.append(logFileName, logString))
    if (err) {
        console.log('loggin to file failed');
    }

    console.log('logging to file succeed')
}

workers.loop = function() {
    setInterval(function() {
        workers.gatherAllChecks();
    }, 1000 * 5)
}

workers.logRotationLoop = function() {
    setInterval(function() {
        workers.gatherAllChecks();
    }, 1000 * 10)
}

workers.rotateLogs = async function() {
    let err, logs
    [err, logs] = await to(_logs.list(false));
    if (err) {
        console.log('Could not find logs to rotate')
        return;
    }

    logs.forEach(logFile => {
        const logId = logFile.replace('.log', '');
        const newLogId = `${logId}-${Date.now()}`;

        [err] =  await to(_logs.compress(logId, newLogId));
        if (err) {
            console.log('Compression failed')
            return;
        }

        [err] = await to(_logs.truncate(logId));
        if (err) {
            console.log('Error truncating log file');
            return;
        }

        console.log('Succed truncation file');
    })
}

workers.init = function() {
    // Execute all the checks immediately
    workers.gatherAllChecks();
    // Call the loop so the check

    workers.loop();

    workers.rotateLogs()

    workers.logRotationLoop()
}

module.exports = workers;