const { validateRequestFields, to, hash } = require('./functions');
const lib = require('./data');
const HTTP_CODES = require('./HttpCodes');
const HttpError = require('./HttpError');
const rulesFields = require('./usersValidation');
const tokens = require('./tokens');

const users = {};

users.post = async (data) => {
    const { payload } = data;
    
    if (!validateRequestFields(payload, rulesFields) || !payload.toAgreement) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Missing required fields!');
    }

    const hashedPassword = hash(payload.password);

    if (!hashedPassword) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Couldn\'t hash the user password')
    }

    const userInfo = {
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone,
        hashedPassword,
        toAgreement: true
    };

    const [err, fd] = await to(lib.create('users', payload.phone, userInfo));

    if (err) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'The user has already existed')
    }

    return [HTTP_CODES.CREATED];

}

users.get = async (data) => {
    const phone = typeof data.queryParsed.phone === 'string' ? data.queryParsed.phone.trim() : null;
    const tokenId = typeof data.headers.token === 'string' ? data.headers.token : null;

    if (!phone) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Phone number is missed');
    }

    if (!tokenId) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Token is missed');
    }

    const [errVerify] = await to(tokens.verifyToken(tokenId, phone));
    if (errVerify) {
        throw new HttpError(HTTP_CODES.FORBIDDEN, 'Token is invalid')
    }

    const [err, userData] = await to(lib.read('users', phone));
    if (err) {
        throw new HttpError(HTTP_CODES.NOT_FOUND, 'User doesn\'t exits')
    }

    delete userData.hashedPassword;
    return [HTTP_CODES.OK, userData];
}

//@TODO only access authenticated
// users to get data
users.put = async (data) => {
    const { payload } = data;
    const phone = typeof payload.phone === 'string' ? payload.phone.trim() : null;
    const tokenId = typeof data.headers.token === 'string' ? data.headers.token : null;


    if (!phone || !validateRequestFields(payload, rulesFields)) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Missing fields');
    }

    if (!tokenId) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Token is missed');
    }

    const [errVerify] = await to(tokens.verifyToken(tokenId, phone));
    if (errVerify) {
        throw new HttpError(HTTP_CODES.FORBIDDEN, 'Token is invalid')
    }

    const [errRead] = await to(lib.read('users', phone));
    if (errRead) {
        throw new HttpError(HTTP_CODES.NOT_FOUND, 'User doesn\'t exits')
    }

    const userData = {...payload}

    if (userData.password && hash(userData.password)) {
        userData.hashedPassword = hash(userData.password);
        delete userData.password;
    }

    const [errUpdate] = await to(lib.update('users', phone, userData));
    if (errUpdate) {
        throw new HttpError(HTTP_CODES.SERVER_ERROR, 'Wrong data');
    }

    return [HTTP_CODES.OK];
}

//@TODO only access authenticated
// users to get data
users.delete = async (data) => {
    let err, userData;
    const { queryParsed } = data;
    const phone = typeof queryParsed.phone === 'string' ? queryParsed.phone.trim() : null;
    const tokenId = typeof data.headers.token === 'string' ? data.headers.token : null;

    if (!phone) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Phone number is missed');        
    }

    if (!tokenId) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Token is missed');
    }

    [err] = await to(tokens.verifyToken(tokenId, phone));
    if (err) {
        throw new HttpError(HTTP_CODES.FORBIDDEN, 'Token is invalid')
    }

    [err, userData] = await to(lib.read('users', phone));
    if (err) {
        throw new HttpError(HTTP_CODES.NOT_FOUND, 'User doesn\'t exits')
    }

    [err] = await to(lib.delete('users', phone));
    if (err) {
        throw new HttpError(HTTP_CODES.SERVER_ERROR, 'Server error')
    }

    const promisesToDeleteChecks = userData.checks.map(id => lib.delete('checks', id));
    [err] = await to(Promise.all(promisesToDeleteChecks));
    if (err) {
        throw new HttpError(HTTP_CODES.SERVER_ERROR, 'Couldnt delete users checks');
    }

    return [HTTP_CODES.OK];
}

module.exports = users;