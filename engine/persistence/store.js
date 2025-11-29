// engine/persistence/store.js
// Fixed: CommonJS → ES6 modules, error handling, async/await support

import logger from '../logger.js';
import { config } from './config.js';

// Lazy-loaded store modules
let storeModule = null;

// Initialize store module on first use
async function getStoreModule() {
  if (storeModule) return storeModule;
  
  if (!config.type) {
    throw new Error("Persistence store error, no store type selected.");
  }
  
  try {
    storeModule = await import(`./${config.type}.js`);
    return storeModule;
  } catch (err) {
    throw new Error(`Failed to load persistence store type "${config.type}": ${err.message}`);
  }
}

// Delete all instances
export async function deleteAll(callback) {
  try {
    const store = await getStoreModule();
    store.deleteAll(callback);
  } catch (err) {
    callback(err);
  }
}

// Delete specific instance
export async function deleteInstance(id, callback) {
  try {
    const store = await getStoreModule();
    store.deleteInstance(id, callback);
  } catch (err) {
    callback(err);
  }
}

// Get workflow definition
export async function getDefinition(name, callback) {
  try {
    const store = await getStoreModule();
    store.getDefinition(name, callback);
  } catch (err) {
    callback(err);
  }
}

// Save workflow definition
export async function saveDefinition(workflowDef, callback) {
  try {
    const store = await getStoreModule();
    store.saveDefinition(workflowDef, callback);
  } catch (err) {
    callback(err);
  }
}

// Delete workflow definition
export async function deleteDefinition(name, callback) {
  try {
    const store = await getStoreModule();
    store.deleteDefinition(name, callback);
  } catch (err) {
    callback(err);
  }
}

// Load workflow definition
export async function loadDefinition(id, callback) {
  try {
    const store = await getStoreModule();
    store.loadDefinition(id, callback);
  } catch (err) {
    callback(err);
  }
}

// Load workflow instance
export async function loadInstance(id, rewind, callback) {
  logger.debug(`loading instance called with ${id}, ${rewind}`);
  try {
    const store = await getStoreModule();
    store.loadInstance(id, rewind, callback);
  } catch (err) {
    callback(err);
  }
}

// Get workflows based on query
export async function getWorkflows(query, callback) {
  try {
    const store = await getStoreModule();
    store.getWorkflows(query, callback);
  } catch (err) {
    callback(err);
  }
}

// Initialize store
export async function initStore(callback) {
  try {
    if (!config.type) {
      callback(null);
      return;
    }
    
    const store = await getStoreModule();
    store.initStore(config, callback);
  } catch (storeErr) {
    callback(storeErr);
  }
}

// Save workflow instance
export async function saveInstance(workflow, callback) {
  try {
    if (!config.type) {
      callback(null);
      return;
    }
    
    const store = await getStoreModule();
    store.saveInstance(workflow, (err) => {
      callback(err);
    });
  } catch (storeErr) {
    callback(storeErr);
  }
}

// Exit store gracefully
export async function exitStore(callback) {
  logger.debug("Store is exiting...");
  try {
    if (!config.type) {
      callback(null);
      return;
    }
    
    const store = await getStoreModule();
    store.exitStore(callback);
  } catch (err) {
    callback(err);
  }
}

// Default export for backward compatibility
export default {
  deleteAll,
  deleteInstance,
  getDefinition,
  saveDefinition,
  deleteDefinition,
  loadDefinition,
  loadInstance,
  getWorkflows,
  initStore,
  saveInstance,
  exitStore
};