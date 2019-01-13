const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const util = require('util');

const open = util.promisify(fs.open);
const close = util.promisify(fs.close);
const appendFile = util.promisify(fs.appendFile);
const readdir = util.promisify(fs.readdir);
const readfile = util.promisify(fs.readFile);
const writefile = util.promisify(fs.writeFile);
const gzip = util.promisify(zlib.gzip);
const unzip = util.promisify(zlib.unzip);
const truncate = util.promisify(fs.truncate);

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

logs.list = function(includeCompressedLogs) {
    return new Promise((resolve, reject) => {
        readdir(logs.baseDir)
            .then(files => {
                if (!files.length) {
                    reject('Empty files array')
                }

                const trimmedFiles = files.map(fileName => {
                    if (fileName.indexOf('.log') > -1) {
                        return fileName.replace('.log', '');
                    }

                    return fileName;
                }).filter(fileName => includeCompressedLogs || fileName.indexOf('.gz.b64') === -1)

                resolve(trimmedFiles);
            })
    })
};

logs.compress = function(logId, newFileId) {
    const src = logId + '.log';
    const destFile = newFileId + '.gz.b64';
    let fileDescriptor;

    return readfile(path.join(logs.baseDir, src), 'utf8')
        .then(file => gzip(file))
        .then((buffer) => Promise.all([buffer, open(path.join(logs.baseDir, destFile), 'wx')]))
        .then(([buffer, fd]) => {
            fileDescriptor = fd;
            return writefile(fd, buffer.toString('base64'));
        })
        .then(() => close(fileDescriptor))
        .catch(err => console.log(err))
}

logs.decompress = function(fieldId) {
    return readfile(path.join(logs.baseDir, fieldId + '.gz.b64'))
        .then(str => {
            const inputBuffer = Buffer.from(str, 'base64');
            return unzip(inputBuffer)
        })
        .then(outputBuffer => outputBuffer.toString())
}

logs.truncate = function(logId) {
    return truncate(path.join(logs.baseDir, logId + '.log'), 0)
}

module.exports = logs;