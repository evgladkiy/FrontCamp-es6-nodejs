const winston = require('winston');

const requestLogger = new winston.Logger({
  transports: [
      new (winston.transports.File)({
        filename: 'info.log',
        level: 'info'
      })
  ]
});

module.exports = function(req) {
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    requestLogger.info(`Request URL: ${url}, method: ${req.method}`);
}
