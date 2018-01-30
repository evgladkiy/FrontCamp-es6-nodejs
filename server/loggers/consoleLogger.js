const winston = require('winston');

const consoleLogger = new winston.Logger({
    transports: [ new (winston.transports.Console)() ]
});

module.exports = function(type, msg) {
    consoleLogger[type](msg);
}
