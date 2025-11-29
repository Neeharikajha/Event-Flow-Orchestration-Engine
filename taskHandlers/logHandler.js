// taskHandlers/logHandler.js
// Log Handler - Logs messages at specified log levels
// Fixed: ES6 modules, validation, better defaults

import logger from '../engine/logger.js';

/**
 * Log Handler
 * Logs a message at the specified log level
 * 
 * Task INPUT:
 * @param {string} task.parameters.level - The log level (info|debug|error|verbose|warn)
 * @param {string} task.parameters.log - The message to log
 * 
 * Supported log levels:
 * - info (default)
 * - debug
 * - error
 * - verbose
 * - warn / warning
 * 
 * @example
 * {
 *   handler: "./taskHandlers/logHandler.js",
 *   parameters: {
 *     level: "info",
 *     log: "Workflow started successfully"
 *   }
 * }
 * 
 * @example
 * // Using variable interpolation
 * {
 *   handler: "./taskHandlers/logHandler.js",
 *   parameters: {
 *     level: "error",
 *     log: "Task failed: $[tasks.previous.errorMsg]"
 *   }
 * }
 */
export default function logHandler(workflowId, taskName, task, callback) {
  try {
    // Validate parameters exist
    if (!task.parameters) {
      callback(
        new Error(`Task [${taskName}] has no parameters property!`),
        task
      );
      return;
    }

    // Validate log message exists
    if (task.parameters.log === undefined || task.parameters.log === null) {
      callback(
        new Error(`Task [${taskName}] has no parameters.log property!`),
        task
      );
      return;
    }

    // Get log level (default to 'info' if not specified)
    const level = (task.parameters.level || 'info').toLowerCase().trim();
    const message = String(task.parameters.log);

    // Log based on specified level
    switch (level) {
      case 'info':
        logger.info(message);
        break;

      case 'debug':
        logger.debug(message);
        break;

      case 'error':
        logger.error(message);
        break;

      case 'verbose':
        logger.verbose(message);
        break;

      case 'warn':
      case 'warning':
        logger.warn(message);
        break;

      default:
        // Unknown log level - warn about it but still log the message
        logger.warn(
          `logHandler failed to find log level [${level}] in task [${taskName}], defaulting to 'info'`
        );
        logger.info(message);
    }

    // Success
    callback(null, task);

  } catch (error) {
    logger.error(`Log handler error in task [${taskName}]: ${error.message}`);
    callback(error, task);
  }
}