const usersRoute = require('./lib/users');
const { to } = require('./lib/functions');

const handlers = {}

handlers.sample = (data, callback) => {

    callback(200, {'name': 'sample handler'});
}

handlers.ping = (data, callback) => {
    callback(200);
}

handlers.notfound = (data, callback) => {
    callback(404);
}

handlers.hello = (data, callback) => {
    callback(200, { 'message': 'Hello world!' })
}

handlers.users = (data, callback) => {
    const { method } = data;

    usersRoute[method](data)
        .then(([statusCode, res]) => callback(statusCode, res))
        .catch(err => callback(err.code, { message: err.message }))
}

const router = {
    'users': handlers.users,
    'sample': handlers.sample,
    'ping': handlers.ping,
    'hello': handlers.hello,
    'notfound': handlers.notfound
}

module.exports = router;