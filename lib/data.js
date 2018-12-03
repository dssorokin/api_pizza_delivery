const fs = require('fs');
const util = require('util');
const path = require('path');

const lib = {};

const open = util.promisify(fs.open);

const writeFile = util.promisify(fs.writeFile);

const close = util.promisify(fs.close);

const read = util.promisify(fs.readFile);

const truncate = util.promisify(fs.ftruncate);

const deleteFile = util.promisify(fs.unlink);

lib.baseDir = path.join(__dirname, '/../.data/')

lib.create = function(dir, file, data) {
    // open the file for writing
    let fileDescriptor;

    return open(this._getFilePath(dir, file), 'wx')
        .then(fd => {
            fileDescriptor = fd;
            const strData = JSON.stringify(data);
            return writeFile(fileDescriptor, strData);
        })
        .then(() => {
            return close(fileDescriptor)
        })
        .then(() => true)
        // .catch(err => {
        //     console.log(err);
        // })
}

lib.read = function(dir, file) {
    return read(this._getFilePath(dir, file), 'utf8')
}

lib.update = function(dir, file, data) {

    return new Promise((resolve, reject) => {
        let fileDescriptor;
        open(this._getFilePath(dir, file), 'r+')
            .then(fd => {
                fileDescriptor = fd;
                return truncate(fd);
            })
            .then(() => {
                if (typeof data !== 'object') {
                    reject('Wrong type of data.')
                }

                const dataStr = JSON.stringify(data);
                return writeFile(fileDescriptor, dataStr);
            })
            .then(() => close(fileDescriptor))
            .catch(err => {
                reject(err);
            });
    });
}

lib.delete = function(dir, file) {
    return deleteFile(this._getFilePath(dir, file))
}

lib._getFilePath = function(dir, file) {
    return path.join(lib.baseDir, dir, file + '.json');
}

 module.exports = lib;