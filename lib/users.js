const { validateRequestFields, to, hash } = require('./functions');
const lib = require('./data');
const HTTP_CODES = require('./HttpCodes');
const HttpError = require('./HttpError');

const users = {};

users.post = async (data) => {
    const { payload } = data;
    const rulesFields = {
        'firstName': {
            'minLength': 1,
            'type': 'string'
        },
        'lastName': {
            'minLength': 1,
            'type': 'string'
        },
        'phone': {
            'minLength': 10,
            'type': 'string'
        },
        'password': {
            'minLength': 1,
            'type': 'string'
        },
        'toAgreement': {
            'type': 'boolean'
        }
    }

    if (!validateRequestFields(payload, rulesFields) || !payload.toAgreement) {
        throw new HttpError(HTTP_CODES.SERVER_ERROR, 'Missing required fields!');
    }

    const hashedPassword = hash(data.password);

    if (!hashedPassword) {
        throw new HttpError(HTTP_CODES.SERVER_ERROR, 'Couldn\'t hash the user password')
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
        throw new HttpError(HTTP_CODES.SERVER_ERROR, 'The user has already existed')
    }

    return [HTTP_CODES.CREATED];

}

//@TODO only access authenticated
// users to get data
users.get = (data, callback) => {

}

users.put = (data, callback) => {

}

users.delete = (data, callback) => {

}

module.exports = users;