import config from 'config';
import winston from 'winston';

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

const ENABLE_ERROR_FILE_LOGGING = process.env.LOG_ERRORS_TO_FILE === 'true';

// Custom format for console logging with colors
const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'MM/DD/YYYY HH:mm:ss' }),
  errors({ stack: true }), // Log the full stack trace
  printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
  })
);

// JSON format for file logging
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }), // Ensure stack trace is included
  json()
);

const transports: winston.transport[] = [
  // Console transport for development
  new winston.transports.Console({
    format: consoleFormat,
    level: 'debug',
  }),

  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: fileFormat,
    level: 'info',
  }),
];

// Conditionally add error log file
if (ENABLE_ERROR_FILE_LOGGING) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      format: fileFormat,
      level: 'error',
    })
  );
}

const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format: fileFormat,
  transports,
  exitOnError: false,
});

// Create a stream object with a 'write' function that will be used by morgan
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
