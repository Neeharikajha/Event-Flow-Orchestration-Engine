
// import winston from 'winston';

// const { createLogger, format, transports, addColors } = winston;

// // Set custom log levels
// const customLevels = {
//   levels: {
//     error: 4,
//     warn: 3,
//     info: 2,
//     verbose: 1,
//     debug: 0
//   },
//   colors: {
//     error: 'red',
//     warn: 'yellow',
//     info: 'cyan',
//     verbose: 'magenta',
//     debug: 'green'
//   }
// };

// addColors(customLevels.colors);

// // Create logger instance
// const logger = createLogger({
//   levels: customLevels.levels,
//   format: format.combine(
//     format.colorize({ all: true }),
//     format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
//     format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
//   ),
//   transports: [
//     new transports.Console({
//       level: 'info',
//       stderrLevels: ['error']
//     })
//   ]
// });

// // Default log level
// logger.level = 'info';

// export default logger;



import winston from 'winston';

const { createLogger, format, transports, addColors } = winston;

// Custom log levels
const customLevels = {
  levels: {
    error: 4,
    warn: 3,
    info: 2,
    verbose: 1,
    debug: 0
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    verbose: 'magenta',
    debug: 'green'
  }
};

addColors(customLevels.colors);

// Create logger instance
const logger = createLogger({
  levels: customLevels.levels,
  format: format.combine(
    format.colorize({ all: true }),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
  ),
  transports: [
    new transports.Console({
      level: 'info',
      stderrLevels: ['error']
    })
  ]
});

// Default log level
logger.level = 'info';

export default logger;
