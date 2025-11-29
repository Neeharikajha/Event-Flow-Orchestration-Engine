// taskHandlers/workflowHandler.js
// Workflow Handler - Execute nested workflows
// Fixed: ES6 modules, proper async handling, race condition bug fix

import * as processus from '../engine/processus.js';
import store from '../engine/persistence/store.js';
import logger from '../engine/logger.js';

/**
 * Workflow Handler
 * Load and execute a workflow from within another workflow
 * Allows for nested/sub-workflow execution
 * 
 * Task INPUT:
 * @param {string} task.parameters.file - Workflow definition file name (required)
 * @param {Object} task.parameters.workflow - Workflow object to execute (optional)
 * @param {string} task.parameters.id - Workflow ID (optional, generates new if not provided)
 * 
 * Task OUTPUT:
 * @param {Object} task.parameters.workflow - The resulting workflow object after execution
 * 
 * @example
 * // Load and execute workflow from file
 * {
 *   handler: "./taskHandlers/workflowHandler.js",
 *   parameters: {
 *     file: "./workflows/sub-workflow.yaml"
 *   }
 * }
 * 
 * @example
 * // Execute provided workflow object
 * {
 *   handler: "./taskHandlers/workflowHandler.js",
 *   parameters: {
 *     file: "inline-workflow",
 *     workflow: {
 *       name: "Inline Workflow",
 *       tasks: { ... }
 *     }
 *   }
 * }
 */
export default function workflowHandler(workflowId, taskName, task, callback) {
  try {
    // Validate parameters exist
    if (!task.parameters) {
      callback(
        new Error(`Task [${taskName}] has no parameters property!`),
        task
      );
      return;
    }

    // Validate file property exists
    if (!task.parameters.file) {
      callback(
        new Error(`Task [${taskName}] has no parameters.file property set!`),
        task
      );
      return;
    }

    // Check if workflow object is provided directly
    if (task.parameters.workflow !== undefined) {
      // Workflow object provided - execute immediately
      logger.debug(`Executing provided workflow object for task: ${taskName}`);
      executeWorkflow(
        task.parameters.file,
        task.parameters.id,
        task.parameters.workflow,
        task,
        taskName,
        callback
      );
    } else {
      // No workflow object - load from file first
      logger.debug(`Loading workflow definition from file: ${task.parameters.file}`);
      loadAndExecuteWorkflow(task, taskName, callback);
    }

  } catch (error) {
    logger.error(`Workflow handler error: ${error.message}`);
    callback(error, task);
  }
}

/**
 * Load workflow definition from file and then execute it
 * CRITICAL: This fixes the race condition bug in the original code
 */
function loadAndExecuteWorkflow(task, taskName, callback) {
  const filePath = task.parameters.file;

  // Load the workflow definition
  store.loadDefinition(filePath, (err, workflowTaskJSON) => {
    if (err) {
      logger.error(`❌ Failed to load workflow definition [${filePath}]: ${err.message}`);
      callback(err, task);
      return;
    }

    // Check if workflow was loaded successfully
    if (!workflowTaskJSON) {
      const error = new Error(
        `Unable to find workflow definition [${filePath}] in task [${taskName}]`
      );
      logger.error(`❌ ${error.message}`);
      callback(error, task);
      return;
    }

    // Execute the loaded workflow
    logger.debug(`✅ Workflow definition loaded successfully from: ${filePath}`);
    executeWorkflow(
      filePath,
      task.parameters.id,
      workflowTaskJSON,
      task,
      taskName,
      callback
    );
  });
}

/**
 * Execute the workflow (loaded or provided)
 */
function executeWorkflow(file, id, workflowJSON, task, taskName, callback) {
  logger.info(`🚀 Executing workflow: ${file}`);

  // Run the workflow
  processus.runWorkflow(file, id, workflowJSON, (err, workflow) => {
    // Store the workflow result (even if error occurred)
    task.parameters.workflow = workflow;

    if (err) {
      logger.error(`❌ Workflow execution failed for [${file}]: ${err.message}`);
      callback(err, task);
      return;
    }

    // Success
    logger.info(`✅ Workflow [${file}] completed successfully`);
    logger.debug(`Workflow result status: ${workflow.status}`);
    callback(null, task);
  });
}