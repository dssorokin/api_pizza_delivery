const HttpError = require('./HttpError');
const config = require('../config');
const lib = require('./data');
const HTTP_CODES = require('./HttpCodes');
const { to, createRandomString, updateObj } = require('./functions');
const tokens = require('./tokens');

const checks = {};

checks.post = async (data) => {
    let { protocol, url, method, successCodes, timeoutSeconds } = data.payload;
    protocol = typeof protocol === 'string' && ['http', 'https'].includes(protocol) ?
        protocol : null;
    url = typeof url === 'string' ? url : null;
    method = typeof method === 'string' && ['post', 'get', 'put', 'delete'].includes(method) ?
        method : null;
    successCodes = typeof successCodes === 'object' && successCodes instanceof Array && successCodes.length > 0 ?
        successCodes : 0;
    timeoutSeconds = typeof timeoutSeconds === 'number' && timeoutSeconds > 1 ?
        timeoutSeconds : null;

    if (!protocol || !url || !method || !successCodes || !timeoutSeconds) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Missing required fields, or inputs are invalid');
    }

    const tokenId = typeof data.headers.token === 'string' ? data.headers.token : null;
    const [err, token] = await to(lib.read('tokens', tokenId));
    if (err) {
        throw new HttpError(HTTP_CODES.FORBIDDEN, 'Token doesn\'t exits')
    }

    const { phone } = token;
    const [errUser, userData] = await to(lib.read('users', phone));
    if (errUser) {
        throw new HttpError(HTTP_CODES.FORBIDDEN, 'User wasn\'t found')
    }

    const userChecks = typeof userData.checks === 'object' && userData.checks instanceof Array ?
        userData.checks : [];

    if (userChecks.length >= config.maxChecks) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, `User already has maximum nubmer of checks ${config.maxChecks}`)
    }

    const checkId = createRandomString(20);
    const checkObj = {
        'id': checkId,
        'userPhone': phone,
        protocol,
        method,
        successCodes,
        timeoutSeconds,
        url
    }

    const [errCheckCreate] = await to(lib.create('checks', checkId, checkObj));
    if (errCheckCreate) {
        throw new HttpError(HTTP_CODES.SERVER_ERROR, 'Check wasn\'t created');
    }

    userData.checks = userChecks;
    userData.checks.push(checkId)
    const [errCheckUpdate] = await to(lib.update('users', phone, userData));
    if (errCheckUpdate) {
        throw new HttpError(HTTP_CODES.SERVER_ERROR, 'User wasn\'t updated')
    }

    return [HTTP_CODES.OK, checkObj];

}

checks.get = async (data) => {
    let err, checkData;
    const id = typeof data.queryParsed.id === 'string' ? data.queryParsed.id.trim() : null;

    if (!id) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Id is missed');
    }
    [err, checkData] = await to(lib.read('checks', id));
    if (err) {
        throw new HttpError(HTTP_CODES.NOT_FOUND, 'Check wasn\'t found');
    }

    const tokenId = typeof data.headers.token === 'string' ? data.headers.token : null;
    [ err ] = await to(tokens.verifyToken(tokenId, checkData.userPhone));
    if (err) {
        throw new HttpError(HTTP_CODES.FORBIDDEN, 'Wrong token');
    }

    return [HTTP_CODES.OK, checkData];
}

checks.put = async (data) => {
    let err, checkData;

    let { id } = data.payload;
    id = typeof id === 'string' ? id.trim() : null;

    let { protocol, url, method, successCodes, timeoutSeconds } = data.payload;
    protocol = typeof protocol === 'string' && ['http', 'https'].includes(protocol) ?
        protocol : null;
    url = typeof url === 'string' ? url : null;
    method = typeof method === 'string' && ['post', 'get', 'put', 'delete'].includes(method) ?
        method : null;
    successCodes = typeof successCodes === 'object' && successCodes instanceof Array && successCodes.length > 0 ?
        successCodes : null;
    timeoutSeconds = typeof timeoutSeconds === 'number' && timeoutSeconds > 1 ?
        timeoutSeconds : null;

    if (!id) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Missing required field id');
    }

    if (!protocol && !url && !method && !successCodes && !timeoutSeconds) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Missing required fields');
    }

    [err, checkData] = await to(lib.read('checks', id));
    if (err) {
        throw new HttpError(HTTP_CODES.NOT_FOUND, 'Check doesn\'t exist');
    }

    const tokenId = typeof data.headers.token === 'string' ? data.headers.token : null;

    [err] = await to(tokens.verifyToken(tokenId, checkData.userPhone));
    if (err) {
        throw new HttpError(HTTP_CODES.FORBIDDEN, 'Wrong token');
    }

    const updatedCheckData = updateObj(checkData, {
        protocol,
        url,
        successCodes,
        method,
        timeoutSeconds
    });

    [err] = await to(lib.update('checks', id, updatedCheckData));
    if (err) {
        throw new HttpError(HTTP_CODES.SERVER_ERROR, 'Check wasn\'t updated');
    }

    return [HTTP_CODES.OK]
}

// Requied data: id
checks.delete = async (data) => {
    let err, checkData, userData;
    const { queryParsed } = data;
    const id = typeof queryParsed.id === 'string' ? queryParsed.id.trim() : null;
    const tokenId = typeof data.headers.token === 'string' ? data.headers.token : null;

    if (!id) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'id number is missed');        
    }

    if (!tokenId) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Token is missed');
    }

    [err, checkData] = await to(lib.read('checks', id));
    if (err) {
        throw new HttpError(HTTP_CODES.NOT_FOUND, 'Check doesn\'t exits')
    }

    [err] = await to(tokens.verifyToken(tokenId, checkData.userPhone));
    if (err) {
        throw new HttpError(HTTP_CODES.FORBIDDEN, 'Token is invalid')
    }

    [err, userData] = await to(lib.read('users', checkData.userPhone));
    if (err) {
        throw new HttpError(HTTP_CODES.NOT_FOUND, 'User doesn\'t exits')
    }

    const { checks } = userData;
    const pos = checks.indexOf(id);
    if (pos === -1) {
        throw new HttpError(HTTP_CODES.SERVER_ERROR, 'Coldnt find the check on the user\'s object')
    }

    checks.splice(pos, 1);

    [err] = await to(lib.update('users', userData.phone, userData));
    if (err) {
        throw new HttpError(HTTP_CODES.SERVER_ERROR, 'User wasnt updated')
    }

    [err] = await to(lib.delete('checks', id));
    if (err) {
        throw new HttpError(HTTP_CODES.SERVER_ERROR, 'Server error')
    }

    return [HTTP_CODES.OK];
}

module.exports = checks;