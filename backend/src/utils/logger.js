'use strict';

const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors, json } = format;

const devFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    process.env.NODE_ENV === 'production' ? json() : combine(colorize(), devFormat)
  ),
  transports: [
    new transports.Console(),
    ...(process.env.NODE_ENV === 'production' ? [
      new transports.File({
        filename: path.join('logs', 'error.log'),
        level: 'error',
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5,
      }),
      new transports.File({
        filename: path.join('logs', 'combined.log'),
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5,
      }),
    ] : []),
  ],
  exceptionHandlers: process.env.NODE_ENV === 'production'
    ? [new transports.File({ filename: path.join('logs', 'exceptions.log') })]
    : [],
});

module.exports = logger;
