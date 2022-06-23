'use strict';

module.exports = (db_pool) => {
    var fs = require('fs');
    var ws = require('ws');
    var path = require('path');
    var config = require('./config');

    var server = require('https').createServer({
        key: fs.readFileSync('sslcert/server.key', 'utf8'),
        cert: fs.readFileSync('sslcert/server.crt', 'utf8')
    });

    var wss = new ws.Server({ 'server': server });

    wss.on('connection', (ws, req) => {
        console.log(`${req.method} ${req.url} connected.`);
        var filename = path.join(config().rootdir, req.url + '.webm');
        if (!fs.existsSync(path.dirname(filename)))
            fs.mkdirSync(path.dirname(filename), { recursive: true });
        fs.createWriteStream(filename);
        ws.on('message', message => {
            fs.createWriteStream(filename, { 'flags': 'a' }).write(message);
        });
        ws.on('close', (code, reason) => {
            console.log(`${req.method} ${req.url} disconnected.`);
        });
    });

    return server;
}
