// taskHandlers/fileHandler.js
// File Handler - Load and save files (JSON or text)
// Fixed: ES6 modules, async operations, better error handling

import fs from 'fs/promises';
import logger from '../engine/logger.js';

/**
 * File Handler
 * Load or save files with automatic JSON parsing/stringification
 * 
 * Loading:
 * - If file contains valid JSON, it's parsed into an object
 * - If not valid JSON, content is stored as a string
 * - Not intended for binary files
 * 
 * Saving:
 * - Contents are saved as formatted JSON
 * 
 * Task INPUT:
 * @param {string} task.parameters.file.name - Filename (with path if needed)
 * @param {*} task.parameters.file.contents - File contents (null/undefined = load operation)
 * 
 * Task OUTPUT:
 * @param {*} task.parameters.file.contents - Loaded/saved contents
 * 
 * @example
 * // Load file
 * {
 *   handler: "./taskHandlers/fileHandler.js",
 *   parameters: {
 *     file: {
 *       name: "./config.json"
 *     }
 *   }
 * }
 * 
 * @example
 * // Save file
 * {
 *   handler: "./taskHandlers/fileHandler.js",
 *   parameters: {
 *     file: {
 *       name: "./output.json",
 *       contents: {
 *         status: "completed",
 *         result: "$[tasks.process.parameters.data]"
 *       }
 *     }
 *   }
 * }
 */
export default async function fileHandler(workflowId, taskName, task, callback) {
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

    // Validate file property exists
    if (!task.parameters.file) {
      logger.debug("No task parameters.file property!");
      callback(
        new Error(`Task [${taskName}] has no task parameters.file property!`),
        task
      );
      return;
    }

    // Validate file name exists
    if (!task.parameters.file.name) {
      callback(
        new Error(`Task [${taskName}] has no task parameters.file.name property!`),
        task
      );
      return;
    }

    const fileName = task.parameters.file.name;
    const contents = task.parameters.file.contents;

    // Determine operation based on contents
    if (contents === null || contents === undefined) {
      // LOAD operation - contents not provided
      await loadFile(fileName, task, taskName, callback);
    } else {
      // SAVE operation - contents provided
      await saveFile(fileName, contents, task, taskName, callback);
    }

  } catch (error) {
    logger.error(`File handler error in task [${taskName}]: ${error.message}`);
    callback(error, task);
  }
}

/**
 * Load file and attempt to parse as JSON
 * If JSON parsing fails, store as string
 */
async function loadFile(fileName, task, taskName, callback) {
  try {
    logger.debug(`Loading file: ${fileName}`);

    // Read file contents as UTF-8 text
    let fileContents = await fs.readFile(fileName, 'utf8');

    // Attempt to parse as JSON
    try {
      fileContents = JSON.parse(fileContents);
      logger.debug(`✅ File parsed as JSON: ${fileName}`);
    } catch (jsonError) {
      // Not valid JSON - keep as string
      logger.debug(`File loaded as text (not valid JSON): ${fileName}`);
    }

    // Store contents in task parameters
    task.parameters.file.contents = fileContents;
    
    logger.info(`✅ File loaded successfully: ${fileName}`);
    callback(null, task);

  } catch (readError) {
    logger.error(`❌ Failed to read file [${fileName}]: ${readError.message}`);
    callback(
      new Error(`Failed to read file [${fileName}] in task [${taskName}]: ${readError.message}`),
      task
    );
  }
}

/**
 * Save contents to file as formatted JSON
 */
async function saveFile(fileName, contents, task, taskName, callback) {
  try {
    logger.debug(`Saving file: ${fileName}`);

    // Convert contents to formatted JSON string
    const fileContents = JSON.stringify(contents, null, 2);

    // Write to file
    await fs.writeFile(fileName, fileContents, 'utf8');

    logger.info(`✅ File saved successfully: ${fileName}`);
    callback(null, task);

  } catch (writeError) {
    logger.error(`❌ Failed to write file [${fileName}]: ${writeError.message}`);
    callback(
      new Error(`Failed to write file [${fileName}] in task [${taskName}]: ${writeError.message}`),
      task
    );
  }
}