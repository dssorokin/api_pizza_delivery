const { validateRequestFields, to, hash } = require('./functions');
const lib = require('./data');
const HTTP_CODES = require('./HttpCodes');
const HttpError = require('./HttpError');
const rulesFields = require('./usersValidation');

const users = {};

users.post = async (data) => {
    const { payload } = data;
    
    if (!validateRequestFields(payload, rulesFields) || !payload.toAgreement) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Missing required fields!');
    }

    const hashedPassword = hash(data.password);

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

//@TODO only access authenticated
// users to get data
users.get = async (data) => {
    const phone = typeof data.queryParsed.phone === 'string' ? data.queryParsed.phone.trim() : null;

    if (!phone) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Phone number is missed');
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

    if (!phone || !validateRequestFields(payload, rulesFields)) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Missing fields');
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
    const { queryParsed } = data;
    const phone = typeof queryParsed.phone === 'string' ? queryParsed.phone.trim() : null;

    if (!phone) {
        throw new HttpError(HTTP_CODES.BAD_REQUEST, 'Phone number is missed');        
    }

    const [errRead] = await to(lib.read('users', phone));
    if (errRead) {
        throw new HttpError(HTTP_CODES.NOT_FOUND, 'User doesn\'t exits')
    }

    const [errDelete] = await to(lib.delete('users', phone));
    if (errDelete) {
        throw new HttpError(HTTP_CODES.SERVER_ERROR, 'Server error')
    }

    return [HTTP_CODES.OK];
}

module.exports = users;