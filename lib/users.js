import { validateRequestFields, to, hash } from './functions';
import lib from './data';

const users = {};

users.post = async (data) => {
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

    if (validateRequestFields(data, rulesFields) && data.toAgreement) {
        const hashedPassword = hash(data.password);
        const userInfo = {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            hashedPassword,
            toAgreement: true
        };
        const [err, fd] = await to(lib.create('users', data.phone));
        if (err) {
            throw new Error('User already exists')
        }


    } else {

    }

}

users.get = (data, callback) => {

}

users.put = (data, callback) => {

}

users.delete = (data, callback) => {

}

module.exports = users;