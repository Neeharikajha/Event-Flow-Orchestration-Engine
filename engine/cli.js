// // cli.js
// // Fixed: CommonJS → ES6, async/await, proper error handling

// import logger from './logger.js';
// import cli from 'cli';
// import fs from 'fs/promises';
// import processus from './processus.js';
// import store from './persistence/store.js';
// import title from './title.js';

// // Main CLI function
// export default async function() {
//   // Show title - ASCII art is cool!
//   console.log(title);

//   // Parse command line arguments
//   cli.parse({
//     log: ['l', 'Sets the log level [debug|verbose|info|warn|error].', 'string', 'info'],
//     file: ['f', 'Workflow or task definition. A task must also include the workflow ID. For YAML use .yml postfix.', 'string', null],
//     id: ['i', 'Workflow ID.', 'string', null],
//     rewind: ['r', 'Time in reverse chronological order. 0 is current, 1 is the previous save point etc.', 'number', 0],
//     delete: ['d', 'Delete a workflow instance', 'string', null],
//     deleteALL: ['', 'Delete ALL workflow instances.', 'bool', false]
//   });

//   // Execute main function
//   cli.main(async (args, options) => {
//     try {
//       // Validate and set log level
//       const validLogLevels = ['debug', 'verbose', 'info', 'warn', 'error'];
//       if (!validLogLevels.includes(options.log)) {
//         logger.error("✘ Invalid log level, see help for more info.");
//         process.exit(1);
//         return;
//       }
//       logger.level = options.log;

//       // Initialize store
//       await new Promise((resolve, reject) => {
//         store.initStore((err) => {
//           if (err) {
//             logger.error(`Failed to initialise store: ${err.message}`);
//             reject(err);
//           } else {
//             resolve();
//           }
//         });
//       });

//       // Handle DELETE ALL command
//       if (options.deleteALL === true) {
//         await handleDeleteAll();
//         return;
//       }

//       // Handle DELETE specific instance
//       if (options.delete !== null) {
//         await handleDeleteInstance(options.delete);
//         return;
//       }

//       // Handle GET existing instance
//       if (options.file === null && options.id !== null) {
//         await handleGetInstance(options.id, options.rewind);
//         return;
//       }

//       // Handle EXECUTE workflow
//       if (options.file !== null) {
//         await handleExecuteWorkflow(options.file, options.id);
//         return;
//       }

//       // No valid command provided
//       logger.error("✘ Must supply a workflow or task filename, or use --id to get an instance.");
//       process.exit(1);

//     } catch (error) {
//       logger.error(`✘ Fatal error: ${error.message}`);
//       process.exit(1);
//     }
//   });
// }

// // Handle delete all instances
// async function handleDeleteAll() {
//   try {
//     await new Promise((resolve, reject) => {
//       store.deleteAll((err) => {
//         if (err) {
//           logger.error(`✘ Failed to delete all: ${err.message}`);
//           reject(err);
//         } else {
//           logger.info("✅ Successfully deleted all workflow instances");
//           resolve();
//         }
//       });
//     });
//     process.exit(0);
//   } catch (err) {
//     process.exit(1);
//   }
// }

// // Handle delete specific instance
// async function handleDeleteInstance(instanceId) {
//   try {
//     logger.info(`Deleting workflow instance: ${instanceId}`);
    
//     await new Promise((resolve, reject) => {
//       store.deleteInstance(instanceId, (err) => {
//         if (err) {
//           logger.error(`✘ Failed to delete instance: ${err.message}`);
//           reject(err);
//         } else {
//           logger.info(`✅ Successfully deleted workflow: ${instanceId}`);
//           resolve();
//         }
//       });
//     });
//     process.exit(0);
//   } catch (err) {
//     process.exit(1);
//   }
// }

// // Handle get existing instance
// async function handleGetInstance(instanceId, rewind) {
//   try {
//     const workflowFile = await new Promise((resolve, reject) => {
//       store.loadInstance(instanceId, rewind, (err, workflow) => {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(workflow);
//         }
//       });
//     });

//     if (!workflowFile) {
//       logger.error(`✘ Unable to find workflow instance: ${instanceId}`);
//       process.exit(1);
//       return;
//     }

//     // Force logger to info for output
//     logger.level = 'info';
//     logger.info(JSON.stringify(workflowFile, null, 2));
//     process.exit(0);

//   } catch (err) {
//     logger.error(`✘ ${err.message}`);
//     process.exit(1);
//   }
// }

// // Handle execute workflow
// async function handleExecuteWorkflow(filePath, workflowId) {
//   try {
//     // Load workflow definition
//     const workflowTaskJSON = await new Promise((resolve, reject) => {
//       store.loadDefinition(filePath, (err, workflow) => {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(workflow);
//         }
//       });
//     });

//     if (!workflowTaskJSON) {
//       logger.error(`✘ Workflow definition not found: ${filePath}`);
//       process.exit(1);
//       return;
//     }

//     // Execute workflow
//     logger.info(`🚀 Executing workflow from: ${filePath}`);
    
//     await new Promise((resolve, reject) => {
//       processus.runWorkflow(filePath, workflowId, workflowTaskJSON, (err, workflow) => {
//         if (err) {
//           reject(err);
//         } else {
//           logger.info(`✅ Workflow completed successfully`);
//           resolve(workflow);
//         }
//       });
//     });

//     process.exit(0);

//   } catch (err) {
//     logger.error(`✘ ${err.message}`);
//     process.exit(1);
//   }
// }

// // Graceful shutdown handler
// process.on('SIGINT', async () => {
//   logger.info('\n🛑 Shutting down gracefully...');
  
//   try {
//     await new Promise((resolve) => {
//       store.exitStore(() => {
//         logger.info('✅ Store closed');
//         resolve();
//       });
//     });
//   } catch (err) {
//     logger.error(`Error during shutdown: ${err.message}`);
//   }
  
//   process.exit(0);
// });

// process.on('SIGTERM', async () => {
//   logger.info('\n🛑 Received SIGTERM, shutting down...');
  
//   try {
//     await new Promise((resolve) => {
//       store.exitStore(() => {
//         resolve();
//       });
//     });
//   } catch (err) {
//     logger.error(`Error during shutdown: ${err.message}`);
//   }
  
//   process.exit(0);
// });

// engine/cli.js
// Updated CLI with queue support

import logger from './logger.js';
import cli from 'cli';
import store from './persistence/store.js';
import { ProcessusEngine } from './ProcessusEngine.js';
import title from './title.js';

export default async function() {
  console.log(title);

  cli.parse({
    log: ['l', 'Sets the log level [debug|verbose|info|warn|error].', 'string', 'info'],
    file: ['f', 'Workflow definition file (JSON or YAML)', 'string', null],
    id: ['i', 'Workflow ID', 'string', null],
    rewind: ['r', 'History rewind (0=current, 1=previous, etc.)', 'number', 0],
    delete: ['d', 'Delete a workflow instance', 'string', null],
    deleteALL: ['', 'Delete ALL workflow instances', 'bool', false],
    
    // NEW: Queue options
    queue: ['q', 'Use queue for execution', 'bool', false],
    priority: ['p', 'Job priority (0=highest, default=0)', 'number', 0],
    bulk: ['b', 'Execute multiple workflows from file (JSON array)', 'bool', false],
    stats: ['s', 'Show queue statistics', 'bool', false],
    retry: ['', 'Retry failed workflows', 'bool', false],
    pause: ['', 'Pause workflow processing', 'bool', false],
    resume: ['', 'Resume workflow processing', 'bool', false]
  });

  cli.main(async (args, options) => {
    try {
      // Set log level
      const validLogLevels = ['debug', 'verbose', 'info', 'warn', 'error'];
      if (!validLogLevels.includes(options.log)) {
        logger.error("✘ Invalid log level");
        process.exit(1);
        return;
      }
      logger.level = options.log;

      // Initialize engine
      const engine = new ProcessusEngine({
        useQueue: options.queue || options.stats || options.retry || options.pause || options.resume
      });
      await engine.initialize();

      // Handle queue operations
      if (options.stats) {
        await handleStats(engine);
        return;
      }

      if (options.retry) {
        await handleRetry(engine);
        return;
      }

      if (options.pause) {
        await engine.pause();
        logger.info('✅ Processing paused');
        process.exit(0);
        return;
      }

      if (options.resume) {
        await engine.resume();
        logger.info('✅ Processing resumed');
        process.exit(0);
        return;
      }

      // Handle DELETE ALL
      if (options.deleteALL === true) {
        await handleDeleteAll(store);
        return;
      }

      // Handle DELETE specific
      if (options.delete !== null) {
        await handleDeleteInstance(store, options.delete);
        return;
      }

      // Handle GET existing instance
      if (options.file === null && options.id !== null) {
        await handleGetInstance(store, options.id, options.rewind);
        return;
      }

      // Handle EXECUTE workflow
      if (options.file !== null) {
        if (options.bulk) {
          await handleExecuteBulk(engine, options.file, options);
        } else {
          await handleExecuteWorkflow(engine, options.file, options);
        }
        return;
      }

      logger.error("✘ Must supply a workflow file or use -i to get an instance");
      process.exit(1);

    } catch (error) {
      logger.error(`✘ Fatal error: ${error.message}`);
      process.exit(1);
    }
  });
}

// Show queue statistics
async function handleStats(engine) {
  try {
    const stats = await engine.getStats();
    
    console.log('\n📊 === System Statistics ===\n');
    
    if (stats.queue) {
      console.log('Workflow Queue:');
      console.log(`  Active: ${stats.queue.workflows.active}`);
      console.log(`  Completed: ${stats.queue.workflows.completed}`);
      console.log(`  Failed: ${stats.queue.workflows.failed}`);
      console.log(`  Waiting: ${stats.queue.workflows.waiting}`);
      
      console.log('\nTask Queue:');
      console.log(`  Active: ${stats.queue['workflow-tasks'].active}`);
      console.log(`  Completed: ${stats.queue['workflow-tasks'].completed}`);
      
      console.log('\nGlobal:');
      console.log(`  Throughput: ${stats.queue.global.throughput} jobs/min`);
      console.log(`  Jobs Processed: ${stats.queue.global.jobsProcessed}`);
      console.log(`  Jobs Failed: ${stats.queue.global.jobsFailed}`);
      console.log(`  Avg Processing Time: ${Math.round(stats.queue.global.avgProcessingTime)}ms`);
    }
    
    console.log('\nRetry System:');
    console.log(`  Fallback Handlers: ${stats.retry.fallbackHandlers}`);
    console.log(`  Strategies: ${stats.retry.strategies.join(', ')}`);
    
    await engine.shutdown();
    process.exit(0);
  } catch (err) {
    logger.error(`❌ Failed to get stats: ${err.message}`);
    process.exit(1);
  }
}

// Retry failed workflows
async function handleRetry(engine) {
  try {
    logger.info('🔄 Retrying failed workflows...');
    const retried = await engine.retryFailed();
    logger.info(`✅ Retried ${retried} failed workflows`);
    await engine.shutdown();
    process.exit(0);
  } catch (err) {
    logger.error(`❌ Failed to retry: ${err.message}`);
    process.exit(1);
  }
}

// Execute single workflow
async function handleExecuteWorkflow(engine, filePath, options) {
  try {
    const workflowTaskJSON = await new Promise((resolve, reject) => {
      store.loadDefinition(filePath, (err, workflow) => {
        if (err) reject(err);
        else resolve(workflow);
      });
    });

    if (!workflowTaskJSON) {
      logger.error(`✘ Workflow definition not found: ${filePath}`);
      process.exit(1);
      return;
    }

    logger.info(`🚀 Executing workflow from: ${filePath}`);
    
    const execOptions = {
      useQueue: options.queue,
      priority: options.priority,
      retry: true
    };

    const result = await engine.executeWorkflow(workflowTaskJSON, execOptions);
    
    if (result.queued) {
      logger.info(`✅ Workflow queued successfully`);
      logger.info(`   Job ID: ${result.jobId}`);
      logger.info(`   Priority: ${options.priority}`);
    } else {
      logger.info(`✅ Workflow completed successfully`);
      logger.info(`   Workflow ID: ${result.id}`);
      logger.info(`   Status: ${result.status}`);
    }

    await engine.shutdown();
    process.exit(0);

  } catch (err) {
    logger.error(`✘ ${err.message}`);
    process.exit(1);
  }
}

// Execute bulk workflows
async function handleExecuteBulk(engine, filePath, options) {
  try {
    const workflowsJSON = await new Promise((resolve, reject) => {
      store.loadDefinition(filePath, (err, workflows) => {
        if (err) reject(err);
        else resolve(workflows);
      });
    });

    if (!Array.isArray(workflowsJSON)) {
      logger.error(`✘ Bulk file must contain an array of workflows`);
      process.exit(1);
      return;
    }

    logger.info(`📋 Executing ${workflowsJSON.length} workflows in bulk`);
    
    const results = await engine.executeBulk(workflowsJSON, {
      useQueue: options.queue,
      priority: options.priority,
      parallel: true
    });

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    logger.info(`✅ Bulk execution complete`);
    logger.info(`   Successful: ${successful}`);
    logger.info(`   Failed: ${failed}`);

    await engine.shutdown();
    process.exit(0);

  } catch (err) {
    logger.error(`✘ ${err.message}`);
    process.exit(1);
  }
}

// Other handlers (unchanged)
async function handleDeleteAll(store) {
  try {
    await new Promise((resolve, reject) => {
      store.deleteAll((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    logger.info("✅ Successfully deleted all workflow instances");
    process.exit(0);
  } catch (err) {
    logger.error(`❌ ${err.message}`);
    process.exit(1);
  }
}

async function handleDeleteInstance(store, instanceId) {
  try {
    logger.info(`Deleting workflow instance: ${instanceId}`);
    await new Promise((resolve, reject) => {
      store.deleteInstance(instanceId, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    logger.info(`✅ Successfully deleted workflow: ${instanceId}`);
    process.exit(0);
  } catch (err) {
    logger.error(`❌ ${err.message}`);
    process.exit(1);
  }
}

async function handleGetInstance(store, instanceId, rewind) {
  try {
    const workflow = await new Promise((resolve, reject) => {
      store.loadInstance(instanceId, rewind, (err, wf) => {
        if (err) reject(err);
        else resolve(wf);
      });
    });

    if (!workflow) {
      logger.error(`✘ Unable to find workflow instance: ${instanceId}`);
      process.exit(1);
      return;
    }

    logger.level = 'info';
    logger.info(JSON.stringify(workflow, null, 2));
    process.exit(0);
  } catch (err) {
    logger.error(`✘ ${err.message}`);
    process.exit(1);
  }
}