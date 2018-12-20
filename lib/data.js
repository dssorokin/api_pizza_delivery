const fs = require('fs');
const util = require('util');
const path = require('path');
const { parseJsonToObj }= require('./functions');

const lib = {};

const open = util.promisify(fs.open);

const writeFile = util.promisify(fs.writeFile);

const close = util.promisify(fs.close);

const read = util.promisify(fs.readFile);

const truncate = util.promisify(fs.ftruncate);

const deleteFile = util.promisify(fs.unlink);

const readDir = util.promisify(fs.readdir);

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
        .then(data => parseJsonToObj(data))
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
            .then(() => resolve())
            .catch(err => {
                reject(err);
            });
    });
}

lib.delete = function(dir, file) {
    return deleteFile(this._getFilePath(dir, file))
}

lib.list = function(dir) {
    return new Promise((resolve, reject) => {
        readDir(path.join(lib.baseDir, dir))
            .then(files => {
                if (!files.length) {
                    reject('Empty file array')
                }
                const trimmedFileNames = files.map(file => file.replace('.json', ''));
                resolve(trimmedFileNames);
            })
    });
}

lib._getFilePath = function(dir, file) {
    return path.join(lib.baseDir, dir, file + '.json');
}

 module.exports = lib;