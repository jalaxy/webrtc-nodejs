'use strict';

var fs = require('fs');

module.exports = () => {
    return JSON.parse(fs.readFileSync('configuration.json', 'utf8'));
}
