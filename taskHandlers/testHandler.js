// taskHandlers/testHandler.js
// Fixed: ES6 modules, cleaner logic

import logger from '../engine/logger.js';

/**
 * Test Handler
 * Used to test workflows with simulated behaviors
 * 
 * Task INPUT:
 * @param {boolean} task.parameters.error - Set true to simulate an error
 * @param {number} task.parameters.delay - Delay time in milliseconds
 * @param {boolean} task.parameters.paused - Set true to simulate paused status
 * 
 * Task OUTPUT:
 * - Task executes after delay (if specified)
 * - Task returns error (if error=true)
 * - Task status set to "paused" (if paused=true)
 */
export default function testHandler(workflowId, taskName, task, callback) {
  try {
    // Validate parameters
    if (!task.parameters) {
      callback(
        new Error(`Task [${taskName}] has no parameters property!`),
        task
      );
      return;
    }

    // Get delay timeout (default 0)
    const timeout = task.parameters.delay || 0;

    // Simulate error if requested
    let error = null;
    if (task.parameters.error === true) {
      error = new Error(`Task [${taskName}] is raising a deliberate error`);
      logger.debug(`Test handler simulating error for task: ${taskName}`);
    }

    // Simulate paused status if requested
    if (task.parameters.paused === true) {
      task.status = 'paused';
      logger.debug(`Test handler setting paused status for task: ${taskName}`);
    }

    // Execute after delay
    if (timeout > 0) {
      logger.debug(`Test handler delaying ${timeout}ms for task: ${taskName}`);
    }

    setTimeout(() => {
      if (error) {
        logger.debug(`Test handler returning error for task: ${taskName}`);
        callback(error, task);
      } else {
        logger.debug(`Test handler completed successfully for task: ${taskName}`);
        callback(null, task);
      }
    }, timeout);

  } catch (handlerError) {
    logger.error(`Test handler error: ${handlerError.message}`);
    callback(handlerError, task);
  }
}