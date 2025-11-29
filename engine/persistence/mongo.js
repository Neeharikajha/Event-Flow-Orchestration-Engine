// engine/persistence/mongo.js
// Fixed: Deprecated MongoDB methods, error handling, connection pooling

import logger from '../logger.js';
import { MongoClient } from 'mongodb';

// MongoDB connection and collections (using singleton pattern)
let client = null;
let mongodb = null;
let workflowInstances = null;
let workflowHistory = null;
let workflowDefinitions = null;

// Initialize MongoDB store
export async function initStore(config, callback) {
  try {
    const url = `mongodb://${config.host}:${config.port}/processus`;
    
    // Connect using MongoClient with options
    client = new MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10
    });

    await client.connect();
    
    // Store DB and collections for future use
    mongodb = client.db('processus');
    workflowInstances = mongodb.collection('instances');
    workflowHistory = mongodb.collection('instances-history');
    workflowDefinitions = mongodb.collection('definitions');

    // Create indexes (createIndex replaces deprecated ensureIndex)
    try {
      await workflowInstances.createIndex({ id: 1 }, { unique: true, background: true });
      await workflowHistory.createIndex({ id: 1 }, { background: true }); // Non-unique for history
      await workflowDefinitions.createIndex({ name: 1 }, { unique: true, background: true });
      
      logger.info('✅ MongoDB store initialized successfully');
      callback(null);
    } catch (indexErr) {
      logger.error(`❌ Failed to create indexes: ${indexErr.message}`);
      callback(indexErr);
    }
  } catch (mongoError) {
    logger.error(`❌ MongoDB connection failed: ${mongoError.message}`);
    callback(mongoError);
  }
}

// Delete all instances and history
export function deleteAll(callback) {
  deleteAllInstances((err) => {
    if (err) {
      callback(err);
      return;
    }
    
    deleteAllHistory(callback);
  });
}

// Delete all workflow instances
function deleteAllInstances(callback) {
  try {
    workflowInstances.deleteMany({}, (err, result) => {
      if (err) {
        logger.error(`❌ Failed to delete instances: ${err.message}`);
      } else {
        logger.info(`🗑️ Deleted ${result.deletedCount} workflow instances`);
      }
      callback(err);
    });
  } catch (mongoError) {
    callback(mongoError);
  }
}

// Delete all history records
function deleteAllHistory(callback) {
  try {
    workflowHistory.deleteMany({}, (err, result) => {
      if (err) {
        logger.error(`❌ Failed to delete history: ${err.message}`);
      } else {
        logger.info(`🗑️ Deleted ${result.deletedCount} history records`);
      }
      callback(err);
    });
  } catch (mongoError) {
    callback(mongoError);
  }
}

// Delete history for specific instance
function deleteInstanceHistory(id, callback) {
  try {
    const query = { id: new RegExp(`^${id}_`) };
    workflowHistory.deleteMany(query, (err, result) => {
      if (err) {
        logger.error(`❌ Failed to delete history for ${id}: ${err.message}`);
      } else {
        logger.debug(`🗑️ Deleted ${result.deletedCount} history records for ${id}`);
      }
      callback(err);
    });
  } catch (mongoError) {
    callback(mongoError);
  }
}

// Delete specific workflow instance
export function deleteInstance(id, callback) {
  try {
    workflowInstances.deleteOne({ id }, (err, result) => {
      if (err) {
        logger.error(`❌ Failed to delete instance ${id}: ${err.message}`);
        callback(err);
        return;
      }

      if (result.deletedCount === 0) {
        logger.warn(`⚠️ Instance ${id} not found`);
        callback(new Error(`Instance ${id} not found`));
        return;
      }

      // Delete associated history
      deleteInstanceHistory(id, callback);
    });
  } catch (mongoError) {
    callback(mongoError);
  }
}

// Delete workflow definition
export function deleteDefinition(name, callback) {
  try {
    workflowDefinitions.deleteOne({ name }, (err, result) => {
      if (err) {
        logger.error(`❌ Failed to delete definition ${name}: ${err.message}`);
      } else if (result.deletedCount === 0) {
        logger.warn(`⚠️ Definition ${name} not found`);
      } else {
        logger.info(`✅ Deleted definition ${name}`);
      }
      callback(err);
    });
  } catch (mongoError) {
    callback(mongoError);
  }
}

// Load workflow definition (defers to file handler)
export async function loadDefinition(id, callback) {
  try {
    const fileModule = await import('./file.js');
    fileModule.loadDefinition(id, callback);
  } catch (fileErr) {
    logger.error(`❌ Failed to load definition: ${fileErr.message}`);
    callback(fileErr);
  }
}

// Save workflow definition
export function saveDefinition(workflowDef, callback) {
  try {
    // Use updateOne with upsert instead of deprecated update
    workflowDefinitions.updateOne(
      { name: workflowDef.name },
      { $set: workflowDef },
      { upsert: true },
      (err, result) => {
        if (err) {
          logger.error(`❌ Failed to save definition ${workflowDef.name}: ${err.message}`);
        } else {
          logger.info(`✅ Saved definition ${workflowDef.name}`);
        }
        callback(err, result);
      }
    );
  } catch (mongoError) {
    callback(mongoError);
  }
}

// Get workflow definition
export function getDefinition(name, callback) {
  try {
    workflowDefinitions.findOne({ name }, (err, result) => {
      if (err) {
        logger.error(`❌ Failed to get definition ${name}: ${err.message}`);
        callback(err);
        return;
      }

      if (!result) {
        callback(new Error(`Definition ${name} not found`));
        return;
      }

      // Remove MongoDB _id from result
      const { _id, ...workflowDef } = result;
      callback(null, workflowDef);
    });
  } catch (mongoError) {
    callback(mongoError);
  }
}

// Get workflows based on query
export async function getWorkflows(query, callback) {
  try {
    const instances = await workflowInstances.find(query).toArray();
    callback(null, instances);
  } catch (mongoError) {
    logger.error(`❌ Failed to get workflows: ${mongoError.message}`);
    callback(mongoError);
  }
}

// Load workflow instance
export async function loadInstance(id, rewind, callback) {
  try {
    if (rewind === 0) {
      // Get current instance
      const result = await workflowInstances.findOne({ id });
      
      if (!result) {
        logger.warn(`⚠️ Instance ${id} not found`);
        callback(new Error(`Instance ${id} not found`));
        return;
      }

      logger.debug(`✅ Loaded instance: ${id}`);
      callback(null, result);
    } else {
      // Get historical version
      const query = { id: new RegExp(`^${id}_`) };
      const history = await workflowHistory.find(query).sort({ id: 1 }).toArray();

      if (!history || history.length === 0) {
        logger.warn(`⚠️ No history found for instance ${id}`);
        callback(new Error(`No history found for instance ${id}`));
        return;
      }

      // Calculate index based on rewind value
      let index = history.length - 1 - rewind;
      if (index < 0) index = 0;

      logger.debug(`✅ Loaded historical instance: ${id} (rewind: ${rewind})`);
      callback(null, history[index]);
    }
  } catch (mongoError) {
    logger.error(`❌ Failed to load instance ${id}: ${mongoError.message}`);
    callback(mongoError);
  }
}

// Save workflow instance
export async function saveInstance(workflow, callback) {
  try {
    if (!workflow._id) {
      // Insert new workflow
      const result = await workflowInstances.insertOne(workflow);
      logger.debug(`✅ Inserted new instance: ${workflow.id}`);

      // Save to history
      const historyWorkflow = {
        ...JSON.parse(JSON.stringify(workflow)),
        _id: undefined,
        id: `${workflow.id}_${Date.now()}`
      };

      await workflowHistory.insertOne(historyWorkflow);
      callback(null);
    } else {
      // Update existing workflow
      const updatedWorkflow = JSON.parse(JSON.stringify(workflow));
      const _id = workflow._id;

      const result = await workflowInstances.replaceOne(
        { _id },
        updatedWorkflow
      );

      if (result.matchedCount === 0) {
        logger.warn(`⚠️ Instance ${workflow.id} not found for update`);
        callback(new Error(`Instance ${workflow.id} not found`));
        return;
      }

      logger.debug(`✅ Updated instance: ${workflow.id}`);

      // Save to history
      const historyWorkflow = {
        ...JSON.parse(JSON.stringify(workflow)),
        _id: undefined,
        id: `${workflow.id}_${Date.now()}`
      };

      await workflowHistory.insertOne(historyWorkflow);
      callback(null);
    }
  } catch (mongoError) {
    logger.error(`❌ Failed to save instance: ${mongoError.message}`);
    callback(mongoError);
  }
}

// Exit store gracefully
export async function exitStore(callback) {
  try {
    if (client) {
      await client.close();
      logger.info('✅ MongoDB connection closed');
    }
    callback(null);
  } catch (err) {
    logger.error(`❌ Error closing MongoDB: ${err.message}`);
    callback(err);
  }
}

// Default export
export default {
  initStore,
  deleteAll,
  deleteInstance,
  deleteDefinition,
  loadDefinition,
  saveDefinition,
  getDefinition,
  getWorkflows,
  loadInstance,
  saveInstance,
  exitStore
};