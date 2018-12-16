const { validateRequestFields,
    to,
    hash,
    createRandomString
} = require('./functions');
const rulesFields = require('./usersValidation');
const HTTP_CODES = require('./HttpCodes');
const HttpError = require('./HttpError');
const lib = require('./data');

const tokens = {};

// Required data: phone, password
tokens.post = async (data) => {
    if (!validateRequestFields(data.payload, rulesFields)) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Missing fields'); 
    }

    const [err, userData] = await to(lib.read('users', data.payload.phone));
    if (err) {
        throw new HttpError(HTTP_CODES.NOT_FOUND, 'User doesn\'t exits')
    }

    const hashedPassword = hash(data.payload.password);
    if (hashedPassword !== userData.hashedPassword) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Passwords didn\'t match for specified user')
    }

    const tokenId = createRandomString(20);
    const expires = Date.now() + 1000*60*60;
    const token = {
        phone: data.payload.phone,
        id: tokenId,
        expires
    }

    const [createErr] = await to(lib.create('tokens', tokenId, token));
    if (createErr) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Couldn\'t create new token')
    }

    return [HTTP_CODES.CREATED, token];

}

tokens.get = async (data) => {
    const id = typeof data.queryParsed.id === 'string' ? data.queryParsed.id.trim() : null;

    if (!id) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Id is missed');
    }

    const [err, token] = await to(lib.read('tokens', id));
    if (err) {
        throw new HttpError(HTTP_CODES.NOT_FOUND, 'Token doesn\'t exits')
    }

    return [HTTP_CODES.OK, token];
}


// Required: id, extend
tokens.put = async (data) => {
    const id = typeof data.payload.id === 'string' ? data.payload.id.trim() : null;
    const extend = typeof data.payload.extend === 'boolean' && data.payload.extend;

    if (!id || !extend) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Missing required fields')
    }

    const [errRead, token] = await to(lib.read('tokens', id));
    if (errRead) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Token doesn\'t exist')
    }

    //Check if the token isn't already expired
    if (token.expires < Date.now()) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Token has expired');
    }

    token.expires = Date.now() + 1000 * 60 * 60;
    const [errUpdate] = await to(lib.update('tokens', id, token));
    if (errUpdate) {
        throw new HttpError(HTTP_CODES.SERVER_ERROR, 'Token wasn\'t updated');
    }

    return [HTTP_CODES.OK];

}

tokens.delete = async (data) => {
    const { queryParsed } = data;
    const id = typeof queryParsed.id === 'string' ? queryParsed.id.trim() : null;

    if (!id) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'id number is missed');        
    }

    const [errRead] = await to(lib.read('tokens', id));
    if (errRead) {
        throw new HttpError(HTTP_CODES.NOT_FOUND, 'Token doesn\'t exits')
    }

    const [errDelete] = await to(lib.delete('tokens', id));
    if (errDelete) {
        throw new HttpError(HTTP_CODES.SERVER_ERROR, 'Server error')
    }

    return [HTTP_CODES.OK];
}

tokens.verifyToken = async (id, phone) => {
    const [err, token] = await to(lib.read('tokens', id));
    if (err) {
        throw new Error()
    }

    if (token.phone !== phone || token.expires < Date.now()) {
        throw new Error()
    }

    return true;
}

module.exports = tokens;