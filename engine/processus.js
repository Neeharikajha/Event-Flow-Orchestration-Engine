// FIXED WORKFLOW ENGINE - Complete Working Code
// This is a corrected version of the workflow engine with all syntax errors fixed

import dotenv from 'dotenv';
import asyncLib from 'async';
import { v4 as uuidv4 } from 'uuid';
import _ from 'underscore';
import logger from './logger.js';
import store from './persistence/store.js';

dotenv.config({ silent: true });

// ============================================
// Main Entry Point - Run Workflow
// ============================================
export const runWorkflow = async (defId, id, workflowTaskJSON, callback) => {
  if (id === null || id === undefined) {
    // NEW WORKFLOW EXECUTION
    execute(workflowTaskJSON, (err, workflow) => {
      if (!err) {
        logger.debug("Workflow returned successfully.");
        logger.debug(JSON.stringify(workflow, null, 2));

        if (workflow.status === "completed") {
          logger.info(`✰ Workflow [${defId}] with id [${workflow.id}] completed successfully.`);
        } else {
          logger.info(`✰ Workflow [${defId}] with id [${workflow.id}] exited without error, but did not complete.`);
        }
      } else {
        logger.error(`✘ ${err.message}`);
        logger.error(`✘ Workflow [${defId}] with id [${workflow.id}] exited with error!`);
        logger.debug(JSON.stringify(workflow, null, 2));
      }

      callback(err, workflow);
    });
  } else {
    // UPDATE EXISTING WORKFLOW
    updateTasks(id, workflowTaskJSON, (err, workflow) => {
      if (!err) {
        logger.debug("Workflow returned successfully.");
        logger.debug(JSON.stringify(workflow, null, 2));

        if (workflow.status === "completed") {
          logger.info(`✰ Workflow [${defId}] with id [${id}] updated successfully.`);
        }
      } else {
        logger.error(`✘ ${err.message}`);
        logger.error(`✘ Workflow [${defId}] with id [${id}] failed to update with error!`);
        logger.debug(JSON.stringify(workflow, null, 2));
      }
      callback(err, workflow);
    });
  }
};

// ============================================
// Update Tasks in Existing Workflow
// ============================================
export const updateTasks = (id, tasks, callback) => {
  store.loadInstance(id, 0, (err, workflow) => {
    if (err) {
      return callback(err);
    }
    
    if (workflow.status !== "completed") {
      const mergedWorkflow = mergeTasks(workflow, tasks);
      execute(mergedWorkflow, callback);
    } else {
      callback(new Error(`Update failed, workflow [${id}] has already completed!`));
    }
  });
};

// ============================================
// Merge Tasks
// ============================================
const mergeTasks = (workflow, tasks) => {
  const taskNames = Object.keys(tasks);

  const makeHandler = (taskName) => (task, name) => {
    if (taskName === name) {
      mergeTask(task, tasks[taskName]);
      return false; // stop scanning
    }
    return true; // continue
  };

  for (const t of taskNames) {
    scanAllTasks(workflow.tasks, true, makeHandler(t));
  }

  return workflow;
};

// ============================================
// Merge Individual Task
// ============================================
const mergeTask = (originalTask, newTask) => {
  originalTask.parameters = newTask.parameters;
  originalTask.status = newTask.status;
  originalTask.errorIf = newTask.errorIf;
  originalTask.skipIf = newTask.skipIf;
  originalTask.tasks = newTask.tasks;

  originalTask.timeCompleted = Date.now();
  originalTask.totalDuration = originalTask.timeCompleted - originalTask.timeOpened;
};

// ============================================
// Add Environment Variables
// ============================================
const addEnvVars = (workflow) => {
  workflow.environment = { ...process.env };
  return workflow;
};

// ============================================
// Execute Workflow
// ============================================
const execute = (workflow, callback) => {
  try {
    workflow = addEnvVars(workflow);
    workflow = validateWorkflow(workflow);

    doPre(workflow, (err, wf) => {
      if (err) {
        return callback(err, wf);
      }
      
      realExecute(wf, (err2, wf2) => {
        if (err2) {
          return callback(err2, wf2);
        }
        
        doPost(wf2, (err3, finalWf) => {
          callback(err3, finalWf);
        });
      });
    });
  } catch (e) {
    callback(e, workflow);
  }
};

// ============================================
// Pre-workflow Hook
// ============================================
const doPre = (workflow, callback) => {
  const task = workflow["pre workflow"];
  executePrePost(workflow, "pre workflow", task, callback);
};

// ============================================
// Post-workflow Hook
// ============================================
const doPost = (workflow, callback) => {
  const task = workflow["post workflow"];
  executePrePost(workflow, "post workflow", task, callback);
};

// ============================================
// Execute Pre/Post Tasks
// ============================================
const executePrePost = (workflow, taskName, task, callback) => {
  if (task) {
    setTaskDataValues(workflow, task);
    setConditionValues(task);

    task.status = "executing";
    task.timeOpened = Date.now();

    executeTask(workflow.id, taskName, task, () => {
      callback(null, workflow);
    });
  } else {
    callback(null, workflow);
  }
};

// ============================================
// Validate Workflow
// ============================================
const validateWorkflow = (workflow) => {
  // Deep clone to avoid mutations
  const json = JSON.stringify(workflow);
  workflow = JSON.parse(json);

  setTaskStatusWaiting(workflow);

  if (!workflow.id) {
    workflow.id = uuidv4();
  }

  return workflow;
};

// ============================================
// Get Tasks by Status
// ============================================
const getTasksByStatus = (parent, status, deep) => {
  const openTasks = {};

  scanAllTasks(parent.tasks, deep, (task, name) => {
    if (task.status === status) {
      openTasks[name] = task;
    }
    return true;
  });

  return openTasks;
};

// ============================================
// Execute Single Task
// ============================================
const executeTask = async (workflowId, taskName, taskObject, callback) => {
  taskObject.timeStarted = Date.now();

  const skip =
    taskObject.skipIf === true ||
    taskObject.errorIf === true ||
    !taskObject.handler;

  taskObject.handlerExecuted = !skip;

  if (!skip) {
    logger.info(`⧖ Starting task [${taskName}]`);

    try {
      // Dynamic import with proper error handling
      const handler = await import(taskObject.handler);
      
      if (!handler.default || typeof handler.default !== 'function') {
        throw new Error(`Handler module must export a default function`);
      }

      handler.default(workflowId, taskName, taskObject, (err, returnedTask) => {
        if (err) {
          returnedTask.errorMsg = err.message;
          returnedTask.status = "error";

          if (returnedTask.ignoreError === true) {
            logger.info(`Ignoring error for task [${taskName}]`);
            returnedTask.status = "executing";
            err = null; // Clear error
          }
        } else {
          logger.info(`✔ Task ${taskName} completed successfully.`);
        }

        if (returnedTask.status === "executing") {
          returnedTask.status = "completed";
          returnedTask.timeCompleted = Date.now();
          returnedTask.handlerDuration = returnedTask.timeCompleted - returnedTask.timeStarted;
          returnedTask.totalDuration = returnedTask.timeCompleted - returnedTask.timeOpened;
        }

        if (returnedTask.status === "paused") {
          returnedTask.handlerDuration = Date.now() - returnedTask.timeStarted;
        }

        callback(err, returnedTask);
      });
    } catch (requireError) {
      taskObject.errorMsg = requireError.message;
      taskObject.status = "error";
      callback(new Error(`Missing module or unexpected error! ${requireError.message}`), taskObject);
    }
  } else {
    let err = null;

    if (taskObject.errorIf === true) {
      err = new Error(`Task [${taskName}] has error condition set.`);
      taskObject.errorMsg = err.message;
      taskObject.status = "error";
    }

    if (taskObject.status === "executing") {
      taskObject.status = "completed";
      taskObject.timeCompleted = Date.now();
      taskObject.handlerDuration = taskObject.timeCompleted - taskObject.timeStarted;
      taskObject.totalDuration = taskObject.timeCompleted - taskObject.timeOpened;
    }

    callback(err, taskObject);
  }
};

// ============================================
// Real Execute - Core Workflow Logic
// ============================================
function realExecute(workflow, callback) {
  store.saveInstance(workflow, (err) => {
    logger.debug("save point a reached.");
    if (err) {
      return callback(err, workflow);
    }

    // Check paused tasks — if any, finish immediately
    const pausedTasks = getTasksByStatus(workflow, "paused", true);
    if (Object.keys(pausedTasks).length > 0) {
      logger.debug("found paused task(s) so returning immediately");
      return callback(null, workflow);
    }

    // Open any waiting & available tasks
    openNextAvailableTask(workflow);

    // Get all open tasks
    const openTasks = getTasksByStatus(workflow, "open", true);
    const taskNames = Object.keys(openTasks);

    const taskExecutionQueue = [];

    // Prepare async execution function
    const makeTaskExecutionFunction = (i) => (cb) => {
      const taskName = taskNames[i];
      const taskObject = openTasks[taskName];
      executeTask(workflow.id, taskName, taskObject, cb);
    };

    // Loop through open tasks and enqueue runnable ones
    for (let i = 0; i < taskNames.length; i++) {
      const task = openTasks[taskNames[i]];
      const taskFn = makeTaskExecutionFunction(i);

      // If open and no children → run
      if (task.status === "open" && !task.tasks) {
        setTaskDataValues(workflow, task);
        setConditionValues(task);
        task.status = "executing";
        taskExecutionQueue.push(taskFn);
      }

      // If open + has children but ALL completed → run
      if (task.status === "open" && task.tasks) {
        if (childHasStatus(task, "completed", true)) {
          setTaskDataValues(workflow, task);
          setConditionValues(task);
          task.status = "executing";
          taskExecutionQueue.push(taskFn);
        }
      }
    }

    // Execute tasks in parallel
    if (taskExecutionQueue.length > 0) {
      asyncLib.parallel(taskExecutionQueue, (error, results) => {
        if (!error) {
          // Continue to next batch of tasks
          return realExecute(workflow, callback);
        }

        // Error: mark workflow as failed
        workflow.status = "error";
        store.saveInstance(workflow, (saveErr) => {
          logger.debug("save point b reached.");
          if (saveErr) {
            return callback(saveErr, workflow);
          }
          return callback(error, workflow);
        });
      });
    } else {
      // No tasks to run → check workflow completion
      if (childHasStatus(workflow, "completed", true)) {
        workflow.status = "completed";
      }

      store.saveInstance(workflow, (saveErr) => {
        logger.debug("save point c reached.");
        if (saveErr) {
          return callback(saveErr, workflow);
        }
        return callback(null, workflow);
      });
    }
  });
}

// ============================================
// Replace $[] References in Task Values
// ============================================
function setTaskDataValues(workflow, task) {
  const taskProperties = Object.keys(task);

  for (const propKey of taskProperties) {
    let value = task[propKey];
    let valueStr = JSON.stringify(value, null, 2);

    logger.debug(`checking for $[] in ${valueStr}`);

    const refValues = valueStr.match(/\$\[([^\]]+)\]/g);
    if (!refValues) continue;

    for (const rawRef of refValues) {
      // Remove $[] wrapper
      let ref = rawRef.slice(2, -1);

      let dataValue = getData(workflow, ref);
      if (dataValue === undefined) {
        dataValue = null;
      }

      if (typeof dataValue === "string") {
        // Escape special characters for JSON
        const escaped = dataValue
          .replace(/\\/g, "\\\\")
          .replace(/\//g, "\\/")
          .replace(/\b/g, "\\b")
          .replace(/\f/g, "\\f")
          .replace(/\n/g, "\\n")
          .replace(/\r/g, "\\r")
          .replace(/\t/g, "\\t")
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'");

        valueStr = valueStr.replace(rawRef, escaped);
      } else {
        const jsonVal = JSON.stringify(dataValue, null, 2);
        const before = valueStr.replace(`"${rawRef}"`, jsonVal);

        valueStr = valueStr === before
          ? valueStr.replace(rawRef, String(dataValue))
          : before;
      }
    }

    try {
      task[propKey] = JSON.parse(valueStr);
    } catch (parseErr) {
      logger.error(`Failed to parse task property ${propKey}: ${parseErr.message}`);
      task[propKey] = value; // Keep original value on parse failure
    }
  }
}

// ============================================
// Initialize Tasks to "waiting"
// ============================================
function setTaskStatusWaiting(workflow) {
  workflow.status = "open";

  if (!workflow.tasks) {
    workflow.tasks = {};
    return;
  }

  scanAllTasks(workflow.tasks, true, (task) => {
    if (!task.status) {
      task.status = "waiting";
    }
    return true;
  });
}

// ============================================
// Check if Child Tasks Match Status
// ============================================
function childHasStatus(parent, status, all) {
  if (!parent.tasks || Object.keys(parent.tasks).length === 0) {
    return false;
  }

  let matchStatus = false;
  let hasChecked = false;

  scanAllTasks(parent.tasks, true, (task) => {
    hasChecked = true;
    matchStatus = task.status === status;

    if (matchStatus && !all) {
      return false; // Found one → stop
    }
    if (!matchStatus && all) {
      return false; // All must match → stop
    }

    return true;
  });

  // If all=true and we checked at least one task, matchStatus should be true
  return hasChecked && matchStatus;
}

// ============================================
// Open Next Available Tasks
// ============================================
function openNextAvailableTask(workflow) {
  if (!workflow.tasks) {
    return false;
  }
  
  openTasks(workflow.tasks);
  return childHasStatus(workflow, "open", false);
}

// ============================================
// Open Tasks That Are Ready to Run
// ============================================
function openTasks(tasks) {
  if (!tasks) return;

  scanAllTasks(tasks, false, (task) => {
    if (task.status === "open") {
      if (childHasStatus(task, "waiting", false)) {
        openTasks(task.tasks);
      }
      return !isBlocking(task);
    }

    if (task.status === "waiting") {
      task.status = "open";
      task.timeOpened = Date.now();

      if (task.tasks) {
        openTasks(task.tasks);
      }

      return !isBlocking(task);
    }

    return true;
  });
}

// ============================================
// Scan All Tasks
// ============================================
export function scanAllTasks(tasks, deep = false, callback) {
  if (!tasks || typeof tasks !== 'object') {
    return true;
  }

  const taskNames = Object.keys(tasks);

  for (const taskName of taskNames) {
    const task = tasks[taskName];

    if (!task || typeof task !== 'object') {
      continue;
    }

    // Execute callback → allow stopping
    const continueScan = callback(task, taskName);
    if (continueScan === false) {
      return false;
    }

    // If deep scan & child tasks exist → recurse
    if (deep && task.tasks && typeof task.tasks === 'object') {
      const childScan = scanAllTasks(task.tasks, true, callback);
      if (childScan === false) {
        return false;
      }
    }
  }

  return true;
}

// ============================================
// Get Data - Read Nested Workflow Values
// ============================================
export function getData(workflow, path) {
  if (!path || typeof path !== 'string') {
    logger.warn(`Invalid path provided to getData: ${path}`);
    return undefined;
  }

  logger.debug("Getting data for path: " + path);

  const parts = path.split(".");
  let current = workflow;

  for (const p of parts) {
    if (current === null || current === undefined) {
      break;
    }
    
    // Handle array notation like tasks[0]
    if (p.includes('[') && p.includes(']')) {
      const arrayMatch = p.match(/^([^\[]+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = current[key];
        if (Array.isArray(current)) {
          current = current[parseInt(index, 10)];
        }
        continue;
      }
    }
    
    current = current[p];
  }

  if (current === undefined) {
    logger.warn(
      `Unable to get value for path '${path}' — check if the path is correct`
    );
  }

  return current;
}

// ============================================
// Set Condition Values
// ============================================
export function setConditionValues(task) {
  if (task.skipIf !== undefined) {
    task.skipIf = getBoolean(task.skipIf);
  }
  if (task.errorIf !== undefined) {
    task.errorIf = getBoolean(task.errorIf);
  }
}

// ============================================
// Check if Task is Blocking
// ============================================
export function isBlocking(task) {
  return getBoolean(task.blocking);
}

// ============================================
// Get Boolean Value
// ============================================
export function getBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return false;
}

// ============================================
// Export All Functions
// ============================================
export default {
  runWorkflow,
  updateTasks,
  scanAllTasks,
  getData,
  setConditionValues,
  isBlocking,
  getBoolean
};