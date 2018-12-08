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

module.exports = rulesFields;