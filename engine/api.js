// api.js
// Processus API for use by other Node.js applications
// Fixed: CommonJS → ES6, added Promise wrappers, improved JSDoc, input validation

import logger from './logger.js';
import store from './persistence/store.js';
import * as p from './processus.js';

// Set default log level
logger.level = 'info';

// ============================================
// INITIALIZATION & CLEANUP
// ============================================

/**
 * Initialise Processus store based on the configured environment variables
 * DB_TYPE default "file" [file | mongo]
 * DB_DIR default "_data" [file only]
 * DB_HOST default "localhost" [mongo only]
 * DB_PORT default 27017 [mongo only]
 * @param {Function} callback - A function(err)
 * @returns {void}
 */
export function init(callback) {
  store.initStore(callback);
}

/**
 * Initialize store with Promise support
 * @returns {Promise<void>}
 * @example
 * await initAsync();
 */
export function initAsync() {
  return new Promise((resolve, reject) => {
    init((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Close store connection gracefully
 * @param {Function} callback - A function(err)
 * @returns {void}
 */
export function close(callback) {
  store.exitStore(callback);
}

/**
 * Close store with Promise support
 * @returns {Promise<void>}
 * @example
 * await closeAsync();
 */
export function closeAsync() {
  return new Promise((resolve, reject) => {
    close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ============================================
// WORKFLOW EXECUTION
// ============================================

/**
 * Executes the supplied workflow and returns the resulting workflow instance
 * @param {Object} workflow - The workflow you wish to execute
 * @param {Function} callback - A function(err, workflow)
 * @returns {void}
 * @example
 * execute(myWorkflow, (err, result) => {
 *   if (err) console.error(err);
 *   else console.log('Workflow completed:', result);
 * });
 */
export function execute(workflow, callback) {
  if (!workflow) {
    callback(new Error('Workflow object is required'));
    return;
  }
  if (typeof callback !== 'function') {
    throw new Error('Callback function is required');
  }
  p.execute(workflow, callback);
}

/**
 * Execute workflow with Promise support
 * @param {Object} workflow - The workflow you wish to execute
 * @returns {Promise<Object>} - Resolved with workflow result
 * @example
 * try {
 *   const result = await executeAsync(myWorkflow);
 *   console.log('Success:', result);
 * } catch (err) {
 *   console.error('Error:', err);
 * }
 */
export function executeAsync(workflow) {
  return new Promise((resolve, reject) => {
    execute(workflow, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/**
 * Updates an existing workflow with the supplied tasks
 * When an already instantiated workflow has a task in status "paused", 
 * this function serves as a callback for any async endpoint wishing to respond
 * @param {string} workflowId - The UUID of the instantiated workflow
 * @param {Object} tasks - The updated task(s) to be 'injected' into the workflow
 * @param {Function} callback - A function(err, workflow)
 * @returns {void}
 * @example
 * updateWorkflow('workflow-123', { task1: { status: 'completed' } }, (err, result) => {
 *   if (err) console.error(err);
 *   else console.log('Updated:', result);
 * });
 */
export function updateWorkflow(workflowId, tasks, callback) {
  if (!workflowId) {
    callback(new Error('Workflow ID is required'));
    return;
  }
  if (!tasks || typeof tasks !== 'object') {
    callback(new Error('Tasks object is required'));
    return;
  }
  if (typeof callback !== 'function') {
    throw new Error('Callback function is required');
  }
  p.updateTasks(workflowId, tasks, callback);
}

/**
 * Update workflow with Promise support
 * @param {string} workflowId - The UUID of the instantiated workflow
 * @param {Object} tasks - The updated task(s)
 * @returns {Promise<Object>} - Resolved with updated workflow
 * @example
 * const updated = await updateWorkflowAsync('workflow-123', updatedTasks);
 */
export function updateWorkflowAsync(workflowId, tasks) {
  return new Promise((resolve, reject) => {
    updateWorkflow(workflowId, tasks, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// ============================================
// WORKFLOW INSTANCE OPERATIONS
// ============================================

/**
 * Gets an existing instance of a workflow
 * @param {string} workflowId - The UUID of the instantiated workflow to get
 * @param {number} [rewind=0] - History rewind (0 = current, 1 = previous, etc.)
 * @param {Function} callback - A function(err, workflow)
 * @returns {void}
 * @example
 * // Get current version
 * getWorkflow('workflow-123', 0, (err, workflow) => {
 *   console.log(workflow);
 * });
 * 
 * // Get previous version
 * getWorkflow('workflow-123', 1, (err, workflow) => {
 *   console.log('Previous state:', workflow);
 * });
 */
export function getWorkflow(workflowId, rewind, callback) {
  // Handle optional rewind parameter
  if (typeof rewind === 'function') {
    callback = rewind;
    rewind = 0;
  }
  
  if (!workflowId) {
    callback(new Error('Workflow ID is required'));
    return;
  }
  if (typeof callback !== 'function') {
    throw new Error('Callback function is required');
  }
  
  logger.debug(`getWorkflow called for: ${workflowId}, rewind: ${rewind}`);
  store.loadInstance(workflowId, rewind, callback);
}

/**
 * Get workflow with Promise support
 * @param {string} workflowId - The UUID of the workflow
 * @param {number} [rewind=0] - History rewind level
 * @returns {Promise<Object>} - Resolved with workflow data
 * @example
 * const workflow = await getWorkflowAsync('workflow-123');
 * const previousVersion = await getWorkflowAsync('workflow-123', 1);
 */
export function getWorkflowAsync(workflowId, rewind = 0) {
  return new Promise((resolve, reject) => {
    getWorkflow(workflowId, rewind, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/**
 * Gets existing instances of workflows identified by query
 * Note: Only available with MongoDB storage
 * @param {Object} [query={}] - Query object representing workflows to search for
 * @param {Function} callback - A function(err, workflows[])
 * @returns {void}
 * @example
 * // Get all completed workflows
 * getWorkflows({ status: 'completed' }, (err, workflows) => {
 *   console.log('Found:', workflows.length);
 * });
 * 
 * // Get workflows with specific name
 * getWorkflows({ name: 'User Onboarding' }, (err, workflows) => {
 *   console.log(workflows);
 * });
 */
export function getWorkflows(query, callback) {
  // Handle optional query parameter
  if (typeof query === 'function') {
    callback = query;
    query = {};
  }
  
  if (typeof query !== 'object' || query === null) {
    callback(new Error('Query must be an object'));
    return;
  }
  if (typeof callback !== 'function') {
    throw new Error('Callback function is required');
  }
  
  store.getWorkflows(query, callback);
}

/**
 * Get workflows with Promise support
 * @param {Object} [query={}] - Query object
 * @returns {Promise<Array>} - Resolved with array of workflows
 * @example
 * const completed = await getWorkflowsAsync({ status: 'completed' });
 * const allWorkflows = await getWorkflowsAsync();
 */
export function getWorkflowsAsync(query = {}) {
  return new Promise((resolve, reject) => {
    getWorkflows(query, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/**
 * Delete an existing instance of a workflow
 * @param {string} workflowId - The UUID of the instantiated workflow to delete
 * @param {Function} callback - A function(err)
 * @returns {void}
 * @example
 * deleteWorkflow('workflow-123', (err) => {
 *   if (err) console.error('Delete failed:', err);
 *   else console.log('Deleted successfully');
 * });
 */
export function deleteWorkflow(workflowId, callback) {
  if (!workflowId) {
    callback(new Error('Workflow ID is required'));
    return;
  }
  if (typeof callback !== 'function') {
    throw new Error('Callback function is required');
  }
  
  store.deleteInstance(workflowId, callback);
}

/**
 * Delete workflow with Promise support
 * @param {string} workflowId - The UUID of the workflow
 * @returns {Promise<void>}
 * @example
 * await deleteWorkflowAsync('workflow-123');
 */
export function deleteWorkflowAsync(workflowId) {
  return new Promise((resolve, reject) => {
    deleteWorkflow(workflowId, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Deletes ALL workflow instances
 * WARNING: This is destructive and cannot be undone!
 * @param {Function} callback - A function(err)
 * @returns {void}
 * @example
 * deleteAll((err) => {
 *   if (err) console.error('Failed:', err);
 *   else console.log('All workflows deleted');
 * });
 */
export function deleteAll(callback) {
  if (typeof callback !== 'function') {
    throw new Error('Callback function is required');
  }
  
  logger.debug("DELETE ALL");
  store.deleteAll(callback);
}

/**
 * Delete all workflows with Promise support
 * @returns {Promise<void>}
 * @example
 * await deleteAllAsync();
 */
export function deleteAllAsync() {
  return new Promise((resolve, reject) => {
    deleteAll((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ============================================
// WORKFLOW DEFINITION OPERATIONS
// ============================================

/**
 * Saves the workflow definition
 * @param {Object} workflowDef - The workflow definition you wish to save
 * @param {string} workflowDef.name - Name of the workflow (required)
 * @param {Function} callback - A function(err, workflowDef)
 * @returns {void}
 * @example
 * const definition = {
 *   name: 'My Workflow',
 *   tasks: { task1: { handler: './handlers/task1.js' } }
 * };
 * saveDefinition(definition, (err, saved) => {
 *   if (err) console.error(err);
 *   else console.log('Saved:', saved);
 * });
 */
export function saveDefinition(workflowDef, callback) {
  if (!workflowDef || typeof workflowDef !== 'object') {
    callback(new Error('Workflow definition object is required'));
    return;
  }
  if (!workflowDef.name) {
    callback(new Error('Workflow definition must have a name property'));
    return;
  }
  if (typeof callback !== 'function') {
    throw new Error('Callback function is required');
  }
  
  store.saveDefinition(workflowDef, callback);
}

/**
 * Save definition with Promise support
 * @param {Object} workflowDef - The workflow definition
 * @returns {Promise<Object>} - Resolved with saved definition
 * @example
 * const saved = await saveDefinitionAsync(myDefinition);
 */
export function saveDefinitionAsync(workflowDef) {
  return new Promise((resolve, reject) => {
    saveDefinition(workflowDef, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/**
 * Gets the workflow definition
 * @param {string} name - The name of the workflow definition you wish to retrieve
 * @param {Function} callback - A function(err, workflowDef)
 * @returns {void}
 * @example
 * getDefinition('My Workflow', (err, definition) => {
 *   if (err) console.error(err);
 *   else console.log(definition);
 * });
 */
export function getDefinition(name, callback) {
  if (!name) {
    callback(new Error('Definition name is required'));
    return;
  }
  if (typeof callback !== 'function') {
    throw new Error('Callback function is required');
  }
  
  store.getDefinition(name, callback);
}

/**
 * Get definition with Promise support
 * @param {string} name - The definition name
 * @returns {Promise<Object>} - Resolved with definition
 * @example
 * const definition = await getDefinitionAsync('My Workflow');
 */
export function getDefinitionAsync(name) {
  return new Promise((resolve, reject) => {
    getDefinition(name, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/**
 * Deletes the workflow definition
 * @param {string} name - The name of the workflow definition you wish to delete
 * @param {Function} callback - A function(err)
 * @returns {void}
 * @example
 * deleteDefinition('My Workflow', (err) => {
 *   if (err) console.error(err);
 *   else console.log('Definition deleted');
 * });
 */
export function deleteDefinition(name, callback) {
  if (!name) {
    callback(new Error('Definition name is required'));
    return;
  }
  if (typeof callback !== 'function') {
    throw new Error('Callback function is required');
  }
  
  store.deleteDefinition(name, callback);
}

/**
 * Delete definition with Promise support
 * @param {string} name - The definition name
 * @returns {Promise<void>}
 * @example
 * await deleteDefinitionAsync('My Workflow');
 */
export function deleteDefinitionAsync(name) {
  return new Promise((resolve, reject) => {
    deleteDefinition(name, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Sets the log level of the Processus logger
 * @param {string} level - The level [debug|verbose|info|warn|error]
 * @returns {Object} - Returns the logger instance
 * @example
 * setLogLevel('debug');
 * setLogLevel('error');
 */
export function setLogLevel(level) {
  const validLevels = ['debug', 'verbose', 'info', 'warn', 'error'];
  
  if (!validLevels.includes(level)) {
    logger.warn(`Invalid log level: ${level}. Using 'info' instead.`);
    logger.level = 'info';
  } else {
    logger.level = level;
  }
  
  return logger;
}

/**
 * Gets the current logger instance
 * @returns {Object} - The logger instance
 * @example
 * const logger = getLogger();
 * logger.info('Custom message');
 */
export function getLogger() {
  return logger;
}

// ============================================
// DEFAULT EXPORT
// ============================================

/**
 * Default export with all API functions
 * Supports both callback and Promise-based interfaces
 */
export default {
  // Initialization
  init,
  initAsync,
  close,
  closeAsync,
  
  // Workflow execution
  execute,
  executeAsync,
  updateWorkflow,
  updateWorkflowAsync,
  
  // Workflow instances
  getWorkflow,
  getWorkflowAsync,
  getWorkflows,
  getWorkflowsAsync,
  deleteWorkflow,
  deleteWorkflowAsync,
  deleteAll,
  deleteAllAsync,
  
  // Workflow definitions
  saveDefinition,
  saveDefinitionAsync,
  getDefinition,
  getDefinitionAsync,
  deleteDefinition,
  deleteDefinitionAsync,
  
  // Utilities
  setLogLevel,
  getLogger
};