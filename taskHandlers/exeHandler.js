// taskHandlers/exeHandler.js
// Exec Handler - Execute shell commands as child processes
// Fixed: ES6 modules, async file operations, better error handling

import { exec, spawn } from 'child_process';
import fs from 'fs/promises';
import fsSync from 'fs';
import logger from '../engine/logger.js';

/**
 * Exec Handler
 * Execute commands as child processes (foreground or background)
 * 
 * Task INPUT:
 * @param {string} task.parameters.cmd - The command to execute
 * @param {boolean} task.parameters.background - Set true to spawn detached process
 * @param {Array} task.parameters.arguments - Arguments array (for background commands)
 * 
 * Task OUTPUT:
 * @param {string} task.parameters.stdout - Standard output (if not background)
 * @param {string} task.parameters.stderr - Standard error (if not background)
 * @param {number} task.parameters.pid - Process ID (if background)
 * 
 * @example
 * // Foreground execution
 * {
 *   handler: "./taskHandlers/exeHandler.js",
 *   parameters: {
 *     cmd: "ls -la"
 *   }
 * }
 * 
 * @example
 * // Background execution
 * {
 *   handler: "./taskHandlers/exeHandler.js",
 *   parameters: {
 *     cmd: "node",
 *     arguments: ["server.js", "--port", "3000"],
 *     background: true
 *   }
 * }
 */
export default function exeHandler(workflowId, taskName, task, callback) {
  try {
    // Validate parameters exist
    if (!task.parameters) {
      logger.debug("No task parameters property!");
      callback(
        new Error(`Task [${taskName}] has no task parameters property!`),
        task
      );
      return;
    }

    // Validate cmd property exists
    if (!task.parameters.cmd) {
      callback(
        new Error(`Task [${taskName}] has no parameters.cmd property set!`),
        task
      );
      return;
    }

    // Execute based on mode
    if (task.parameters.background === true) {
      executeBackground(workflowId, taskName, task, callback);
    } else {
      executeForeground(taskName, task, callback);
    }

  } catch (error) {
    logger.error(`Exec handler error: ${error.message}`);
    callback(error, task);
  }
}

/**
 * Execute command in background (detached process)
 * Output is written to [workflowId].log file
 */
function executeBackground(workflowId, taskName, task, callback) {
  try {
    const logFile = `./${workflowId}.log`;
    
    // Open log file for writing (append mode)
    const out = fsSync.openSync(logFile, 'a');
    const err = fsSync.openSync(logFile, 'a');

    // Get arguments (default to empty array if not provided)
    const args = task.parameters.arguments || [];

    logger.debug(`Spawning background process: ${task.parameters.cmd} ${args.join(' ')}`);

    // Spawn detached process
    const child = spawn(task.parameters.cmd, args, {
      detached: true,
      stdio: ['ignore', out, err]
    });

    // Store process ID
    task.parameters.pid = child.pid;
    
    // Unref to allow parent process to exit independently
    child.unref();

    logger.info(`✅ Background process started with PID: ${child.pid}`);
    callback(null, task);

  } catch (error) {
    logger.error(`❌ Failed to spawn background process: ${error.message}`);
    callback(error, task);
  }
}

/**
 * Execute command in foreground (wait for completion)
 * stdout and stderr are captured and stored in task parameters
 */
function executeForeground(taskName, task, callback) {
  logger.debug(`Executing command: ${task.parameters.cmd}`);

  // Execute the command
  exec(task.parameters.cmd, (error, stdout, stderr) => {
    try {
      // Store output (strip trailing newlines)
      task.parameters.stdout = stdout.replace(/\n$/, '');
      task.parameters.stderr = stderr.replace(/\n$/, '');

      // Log output if present
      if (task.parameters.stdout) {
        logger.info(task.parameters.stdout);
      }
      
      if (task.parameters.stderr) {
        logger.error(task.parameters.stderr);
      }

      // Handle execution errors
      if (error) {
        callback(
          new Error(`exec failed with: [${error.message}] in task [${taskName}]`),
          task
        );
        return;
      }

      // Check for stderr (treat as error if present)
      if (task.parameters.stderr) {
        callback(
          new Error(`exec failed with: [${task.parameters.stderr}] in task [${taskName}]`),
          task
        );
        return;
      }

      // Success
      logger.debug(`✅ Command completed successfully: ${task.parameters.cmd}`);
      callback(null, task);

    } catch (processError) {
      logger.error(`❌ Error processing exec output: ${processError.message}`);
      callback(processError, task);
    }
  });
}