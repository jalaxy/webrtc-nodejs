var fs = require('fs');
var ws = require('ws');

var server = require('https').createServer({
    key: fs.readFileSync('sslcert/server.key', 'utf8'),
    cert: fs.readFileSync('sslcert/server.crt', 'utf8')
});

var wss = new ws.Server({ 'server': server });

wss.on('connection', (ws, req) => {
    console.log(`${req.method} ${req.url} connected.`);
    fs.createWriteStream('stream/' + req.url.split('/').join('.') + '.webm')
    ws.on('message', message => {
        fs.createWriteStream(
            'stream/' + req.url.split('/').join('.') + '.webm', { 'flags': 'a' })
            .write(message);
    });
    ws.on('close', (code, reason) => {
        console.log(`${req.method} ${req.url} disconnected.`);
    });
});

module.exports = server;
