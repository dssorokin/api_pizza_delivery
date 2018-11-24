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

const router = {
    'sample': handlers.sample,
    'ping': handlers.ping,
    'hello': handlers.hello,
    'notfound': handlers.notfound
}

module.exports = router;