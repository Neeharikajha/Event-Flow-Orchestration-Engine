// cli.js
// Fixed: CommonJS → ES6, async/await, proper error handling

import logger from './logger.js';
import cli from 'cli';
import fs from 'fs/promises';
import processus from './processus.js';
import store from './persistence/store.js';
import title from './title.js';

// Main CLI function
export default async function() {
  // Show title - ASCII art is cool!
  console.log(title);

  // Parse command line arguments
  cli.parse({
    log: ['l', 'Sets the log level [debug|verbose|info|warn|error].', 'string', 'info'],
    file: ['f', 'Workflow or task definition. A task must also include the workflow ID. For YAML use .yml postfix.', 'string', null],
    id: ['i', 'Workflow ID.', 'string', null],
    rewind: ['r', 'Time in reverse chronological order. 0 is current, 1 is the previous save point etc.', 'number', 0],
    delete: ['d', 'Delete a workflow instance', 'string', null],
    deleteALL: ['', 'Delete ALL workflow instances.', 'bool', false]
  });

  // Execute main function
  cli.main(async (args, options) => {
    try {
      // Validate and set log level
      const validLogLevels = ['debug', 'verbose', 'info', 'warn', 'error'];
      if (!validLogLevels.includes(options.log)) {
        logger.error("✘ Invalid log level, see help for more info.");
        process.exit(1);
        return;
      }
      logger.level = options.log;

      // Initialize store
      await new Promise((resolve, reject) => {
        store.initStore((err) => {
          if (err) {
            logger.error(`Failed to initialise store: ${err.message}`);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Handle DELETE ALL command
      if (options.deleteALL === true) {
        await handleDeleteAll();
        return;
      }

      // Handle DELETE specific instance
      if (options.delete !== null) {
        await handleDeleteInstance(options.delete);
        return;
      }

      // Handle GET existing instance
      if (options.file === null && options.id !== null) {
        await handleGetInstance(options.id, options.rewind);
        return;
      }

      // Handle EXECUTE workflow
      if (options.file !== null) {
        await handleExecuteWorkflow(options.file, options.id);
        return;
      }

      // No valid command provided
      logger.error("✘ Must supply a workflow or task filename, or use --id to get an instance.");
      process.exit(1);

    } catch (error) {
      logger.error(`✘ Fatal error: ${error.message}`);
      process.exit(1);
    }
  });
}

// Handle delete all instances
async function handleDeleteAll() {
  try {
    await new Promise((resolve, reject) => {
      store.deleteAll((err) => {
        if (err) {
          logger.error(`✘ Failed to delete all: ${err.message}`);
          reject(err);
        } else {
          logger.info("✅ Successfully deleted all workflow instances");
          resolve();
        }
      });
    });
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
}

// Handle delete specific instance
async function handleDeleteInstance(instanceId) {
  try {
    logger.info(`Deleting workflow instance: ${instanceId}`);
    
    await new Promise((resolve, reject) => {
      store.deleteInstance(instanceId, (err) => {
        if (err) {
          logger.error(`✘ Failed to delete instance: ${err.message}`);
          reject(err);
        } else {
          logger.info(`✅ Successfully deleted workflow: ${instanceId}`);
          resolve();
        }
      });
    });
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
}

// Handle get existing instance
async function handleGetInstance(instanceId, rewind) {
  try {
    const workflowFile = await new Promise((resolve, reject) => {
      store.loadInstance(instanceId, rewind, (err, workflow) => {
        if (err) {
          reject(err);
        } else {
          resolve(workflow);
        }
      });
    });

    if (!workflowFile) {
      logger.error(`✘ Unable to find workflow instance: ${instanceId}`);
      process.exit(1);
      return;
    }

    // Force logger to info for output
    logger.level = 'info';
    logger.info(JSON.stringify(workflowFile, null, 2));
    process.exit(0);

  } catch (err) {
    logger.error(`✘ ${err.message}`);
    process.exit(1);
  }
}

// Handle execute workflow
async function handleExecuteWorkflow(filePath, workflowId) {
  try {
    // Load workflow definition
    const workflowTaskJSON = await new Promise((resolve, reject) => {
      store.loadDefinition(filePath, (err, workflow) => {
        if (err) {
          reject(err);
        } else {
          resolve(workflow);
        }
      });
    });

    if (!workflowTaskJSON) {
      logger.error(`✘ Workflow definition not found: ${filePath}`);
      process.exit(1);
      return;
    }

    // Execute workflow
    logger.info(`🚀 Executing workflow from: ${filePath}`);
    
    await new Promise((resolve, reject) => {
      processus.runWorkflow(filePath, workflowId, workflowTaskJSON, (err, workflow) => {
        if (err) {
          reject(err);
        } else {
          logger.info(`✅ Workflow completed successfully`);
          resolve(workflow);
        }
      });
    });

    process.exit(0);

  } catch (err) {
    logger.error(`✘ ${err.message}`);
    process.exit(1);
  }
}

// Graceful shutdown handler
process.on('SIGINT', async () => {
  logger.info('\n🛑 Shutting down gracefully...');
  
  try {
    await new Promise((resolve) => {
      store.exitStore(() => {
        logger.info('✅ Store closed');
        resolve();
      });
    });
  } catch (err) {
    logger.error(`Error during shutdown: ${err.message}`);
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('\n🛑 Received SIGTERM, shutting down...');
  
  try {
    await new Promise((resolve) => {
      store.exitStore(() => {
        resolve();
      });
    });
  } catch (err) {
    logger.error(`Error during shutdown: ${err.message}`);
  }
  
  process.exit(0);
});