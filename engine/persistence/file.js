// engine/persistence/file.js
// Fixed: Sync → Async operations, proper error handling, glob patterns

import logger from '../logger.js';
import fs from 'fs/promises';
import fsSync from 'fs';
import { glob } from 'glob';
import yaml from 'js-yaml';
import path from 'path';

let gConfig = null;
let initialised = false;

// Save workflow definition
export async function saveDefinition(workflowDef, callback) {
  try {
    const filePath = path.join(gConfig.dataDirectory, `${workflowDef.name}.def`);
    await fs.writeFile(filePath, JSON.stringify(workflowDef, null, 2), 'utf8');
    logger.info(`✅ Saved definition: ${workflowDef.name}`);
    callback(null, workflowDef);
  } catch (fileError) {
    logger.error(`❌ Failed to save definition: ${fileError.message}`);
    callback(fileError);
  }
}

// Get workflow definition
export async function getDefinition(name, callback) {
  try {
    const filePath = path.join(gConfig.dataDirectory, `${name}.def`);
    const data = await fs.readFile(filePath, 'utf8');
    const workflowDef = JSON.parse(data);
    callback(null, workflowDef);
  } catch (fileError) {
    logger.error(`❌ Failed to get definition ${name}: ${fileError.message}`);
    callback(fileError);
  }
}

// Delete workflow definition
export async function deleteDefinition(name, callback) {
  try {
    const filePath = path.join(gConfig.dataDirectory, `${name}.def`);
    await fs.unlink(filePath);
    logger.info(`✅ Deleted definition: ${name}`);
    callback(null);
  } catch (fileError) {
    logger.error(`❌ Failed to delete definition: ${fileError.message}`);
    callback(fileError);
  }
}

// Delete all workflow instances
export async function deleteAll(callback) {
  try {
    logger.debug("DELETE ALL");
    
    // Find all files except definitions (*.def)
    const pattern = path.join(gConfig.dataDirectory, '*');
    const files = await glob(pattern, {
      ignore: path.join(gConfig.dataDirectory, '*.def')
    });

    if (!files || files.length === 0) {
      logger.info("No workflows to delete.");
      callback(null);
      return;
    }

    logger.debug(`Deleting ${files.length} files`);

    // Delete all files
    await Promise.all(
      files.map(file => 
        fs.unlink(file).catch(err => {
          logger.warn(`Failed to delete ${file}: ${err.message}`);
        })
      )
    );

    logger.info(`✅ Deleted ${files.length} workflow files`);
    callback(null);
  } catch (err) {
    logger.error(`❌ Failed to delete all: ${err.message}`);
    callback(err);
  }
}

// Delete specific workflow instance
export async function deleteInstance(id, callback) {
  try {
    logger.debug(`DELETE instance: ${id}`);
    const current = path.join(gConfig.dataDirectory, id);

    // Delete main file
    await fs.unlink(current);
    logger.info(`✅ Deleted workflow: ${id}`);

    // Delete history files
    const historyPattern = `${current}_*`;
    const historyFiles = await glob(historyPattern);

    if (historyFiles && historyFiles.length > 0) {
      await Promise.all(
        historyFiles.map(file => 
          fs.unlink(file).catch(err => {
            logger.warn(`Failed to delete history ${file}: ${err.message}`);
          })
        )
      );
      logger.info(`✅ Deleted ${historyFiles.length} history files for ${id}`);
    } else {
      logger.info(`No history for workflow ${id}`);
    }

    callback(null);
  } catch (err) {
    logger.error(`❌ Failed to delete instance ${id}: ${err.message}`);
    callback(err);
  }
}

// Check if file is YAML
function isYaml(file) {
  return file.endsWith('.yml') || file.endsWith('.yaml');
}

// Load workflow definition from file
export async function loadDefinition(id, callback) {
  logger.info(`Reading workflow file: ${id}`);

  try {
    // Read file
    const workflowTaskFile = await fs.readFile(id, 'utf8');
    logger.debug(`File loaded: ${id}`);

    let workflowTaskJSON;

    if (isYaml(id)) {
      // Parse YAML
      try {
        workflowTaskJSON = yaml.load(workflowTaskFile);
      } catch (yamlErr) {
        logger.error(`❌ Failed to parse YAML file ${id}: ${yamlErr.message}`);
        callback(yamlErr, null);
        return;
      }
    } else {
      // Parse JSON
      try {
        workflowTaskJSON = JSON.parse(workflowTaskFile);
      } catch (jsonErr) {
        logger.error(`❌ Failed to parse JSON file ${id}: ${jsonErr.message}`);
        callback(jsonErr, null);
        return;
      }
    }

    callback(null, workflowTaskJSON);
  } catch (err) {
    logger.error(`❌ Failed to open file ${id}: ${err.message}`);
    callback(err, null);
  }
}

// Load workflow instance
export async function loadInstance(id, rewind, callback) {
  try {
    const current = path.join(gConfig.dataDirectory, id);
    const historyPattern = `${current}_*`;
    
    // Find all history files
    const files = await glob(historyPattern);

    let targetFile = current;

    if (files && files.length > 0 && rewind > 0) {
      // Load historical version
      if (rewind > files.length) {
        logger.warn(
          `Rewind value ${rewind} exceeds history length ${files.length}, using oldest`
        );
        rewind = files.length;
      }

      // Sort files to get correct order
      files.sort();
      const index = files.length - rewind;
      targetFile = files[index >= 0 ? index : 0];
    }

    // Read the target file
    const data = await fs.readFile(targetFile, 'utf8');
    const workflowLoaded = JSON.parse(data);

    logger.debug(`✅ Loaded instance: ${id}${rewind > 0 ? ` (rewind: ${rewind})` : ''}`);
    callback(null, workflowLoaded);
  } catch (err) {
    logger.error(`❌ Unable to find workflow ${id}: ${err.message}`);
    callback(err, null);
  }
}

// Get workflows (not implemented for file storage)
export function getWorkflows(query, callback) {
  callback(
    new Error("getWorkflows is not implemented in file type storage, use mongo.")
  );
}

// Initialize file store
export async function initStore(config, callback) {
  gConfig = config;

  if (initialised) {
    callback(null);
    return;
  }

  try {
    logger.debug(`Checking for data directory: ${gConfig.dataDirectory}`);
    
    // Check if directory exists
    try {
      await fs.access(gConfig.dataDirectory);
      initialised = true;
      logger.info(`✅ Data directory exists: ${gConfig.dataDirectory}`);
      callback(null);
    } catch (err) {
      // Directory doesn't exist, create it
      try {
        logger.debug(`Creating data directory: ${gConfig.dataDirectory}`);
        await fs.mkdir(gConfig.dataDirectory, { recursive: true });
        initialised = true;
        logger.info(`✅ Created data directory: ${gConfig.dataDirectory}`);
        callback(null);
      } catch (mkdirErr) {
        logger.error(`❌ Fatal: Unable to create data directory: ${mkdirErr.message}`);
        callback(mkdirErr);
      }
    }
  } catch (error) {
    logger.error(`❌ Fatal: Store initialization failed: ${error.message}`);
    callback(error);
  }
}

// Save workflow instance
export async function saveInstance(workflow, callback) {
  try {
    const current = path.join(gConfig.dataDirectory, workflow.id);

    // Check if file exists
    try {
      await fs.access(current);
      
      // File exists, rename it with timestamp
      const timestamp = Date.now();
      const historyFile = `${current}_${timestamp}`;
      
      await fs.rename(current, historyFile);
      logger.debug(`✅ Archived to: ${historyFile}`);
    } catch (accessErr) {
      // File doesn't exist, this is fine (first save)
      logger.debug(`Creating new workflow file: ${current}`);
    }

    // Write current workflow
    await fs.writeFile(current, JSON.stringify(workflow, null, 2), 'utf8');
    logger.debug(`✅ Saved instance: ${workflow.id}`);
    callback(null);
  } catch (err) {
    logger.error(`❌ Failed to save instance ${workflow.id}: ${err.message}`);
    callback(err);
  }
}

// Exit store (no cleanup needed for file storage)
export function exitStore(callback) {
  logger.debug("File store exiting");
  callback(null);
}

// Default export
export default {
  saveDefinition,
  getDefinition,
  deleteDefinition,
  deleteAll,
  deleteInstance,
  loadDefinition,
  loadInstance,
  getWorkflows,
  initStore,
  saveInstance,
  exitStore
};