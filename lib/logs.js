const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const util = require('util');

const open = util.promisify(fs.open);
const close = util.promisify(fs.close);
const appendFile = util.promisify(fs.appendFile);

const logs = {}

logs.baseDir = path.join(__dirname, '/../.logs/')

logs.append = async function(logFileName, logString) {
    let fileDescriptor;

    return open(path.join(logs.baseDir, logFileName + '.log'), 'a')
        .then(fd => {
            fileDescriptor = fd;
            return appendFile(fileDescriptor, logString + '\n');
        })
        .then(() => {
            return close(fileDescriptor)
        })
}


module.exports = logs;