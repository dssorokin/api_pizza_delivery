const usersRoutes = require('./users');
const tokensRoutes = require('./tokens');
const checksRoutes = require('./checks');

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

    usersRoutes[method](data)
        .then(([statusCode, res]) => callback(statusCode, res))
        .catch(err => callback(err.statusCode, { message: err.message }))
}

handlers.tokens = (data, callback) => {
    const { method } = data;

    tokensRoutes[method](data)
        .then(([statusCode, res]) => callback(statusCode, res))
        .catch(err => callback(err.statusCode, { message: err.message }))
}

handlers.checks = (data, callback) => {
    const { method } = data;

    checksRoutes[method](data)
        .then(([statusCode, res]) => callback(statusCode, res))
        .catch(err => callback(err.statusCode, { message: err.message }))
}

const router = {
    'users': handlers.users,
    'sample': handlers.sample,
    'ping': handlers.ping,
    'hello': handlers.hello,
    'notfound': handlers.notfound,
    'tokens': handlers.tokens,
    'checks': handlers.checks
}

module.exports = router;