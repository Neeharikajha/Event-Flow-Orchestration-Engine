// taskHandlers/conditionalHandler.js
// Fixed: ES6 modules, better logic, fixed bugs

import logger from '../engine/logger.js';

/**
 * Condition Handler
 * A simple condition evaluation handler for non-programmers
 * 
 * Task INPUT:
 * @param {Object} task.parameters.conditions - Condition objects
 * 
 * Supported operators (case-insensitive):
 * - "IS", "EQUALS", "=", "MATCH"
 * - "IS NOT", "NOT EQUALS", "!=", "NOT MATCH"
 * - "GREATER THAN", ">"
 * - "LESS THAN", "<"
 * - "GREATER OR EQUALS", ">="
 * - "LESS OR EQUALS", "<="
 * 
 * Task OUTPUT:
 * @param {Object} task.parameters.conditions - Each condition includes result
 * @param {boolean} task.parameters.anyValid - true if ANY condition is true
 * @param {boolean} task.parameters.allValid - true if ALL conditions are true
 * @param {boolean} task.parameters.notAnyValid - !anyValid
 * @param {boolean} task.parameters.notAllValid - !allValid
 */
export default function conditionalHandler(workflowId, taskName, task, callback) {
  try {
    // Validate task parameters
    if (!task.parameters) {
      const error = new Error(`Task [${taskName}] has no parameters property!`);
      logger.debug("No task parameters property!");
      callback(error, task);
      return;
    }

    // Validate conditions property
    if (!task.parameters.conditions) {
      callback(
        new Error(`Task [${taskName}] has no parameters.conditions property set!`),
        task
      );
      return;
    }

    // Get condition names
    const conditionNames = Object.keys(task.parameters.conditions);

    // Initialize result flags
    task.parameters.anyValid = false;
    task.parameters.allValid = conditionNames.length > 0; // Only true if all pass

    // Process each condition
    for (const conditionName of conditionNames) {
      const condition = task.parameters.conditions[conditionName];

      // Extract values
      let valA = condition.valueA;
      let valB = condition.valueB;
      const op = condition.operator;

      // Validate condition properties
      if (valA === undefined) {
        callback(
          new Error(`Task [${taskName}] condition [${conditionName}] has no valueA property set!`),
          task
        );
        return;
      }

      if (valB === undefined) {
        callback(
          new Error(`Task [${taskName}] condition [${conditionName}] has no valueB property set!`),
          task
        );
        return;
      }

      if (op === undefined) {
        callback(
          new Error(`Task [${taskName}] condition [${conditionName}] has no operator property set!`),
          task
        );
        return;
      }

      // Convert to comparable format
      // If not a number, stringify for comparison
      if (isNaN(valA)) {
        valA = JSON.stringify(valA);
      }
      if (isNaN(valB)) {
        valB = JSON.stringify(valB);
      }

      // Evaluate based on operator
      const operatorLower = op.toLowerCase().trim();
      let isValid = false;

      switch (operatorLower) {
        case 'is':
        case 'equals':
        case '=':
        case 'match':
          isValid = valA === valB;
          logger.debug(`Condition [${conditionName}]: ${valA} === ${valB} = ${isValid}`);
          break;

        case 'is not':
        case 'not equals':
        case '!=':
        case 'not match':
          isValid = valA !== valB;
          logger.debug(`Condition [${conditionName}]: ${valA} !== ${valB} = ${isValid}`);
          break;

        case 'greater than':
        case 'greater':
        case '>':
          isValid = valA > valB;
          logger.debug(`Condition [${conditionName}]: ${valA} > ${valB} = ${isValid}`);
          break;

        case 'less than':
        case 'less':
        case '<':
          isValid = valA < valB;
          logger.debug(`Condition [${conditionName}]: ${valA} < ${valB} = ${isValid}`);
          break;

        case 'greater or equals':
        case '>=':
          isValid = valA >= valB;
          logger.debug(`Condition [${conditionName}]: ${valA} >= ${valB} = ${isValid}`);
          break;

        case 'less or equals':
        case '<=':
          isValid = valA <= valB;
          logger.debug(`Condition [${conditionName}]: ${valA} <= ${valB} = ${isValid}`);
          break;

        default:
          callback(
            new Error(`Unknown conditional operator [${op}] in task [${taskName}]`),
            task
          );
          return;
      }

      // Store result in condition
      condition.valid = isValid;
      condition.invalid = !isValid;

      // Update aggregate flags
      if (isValid) {
        task.parameters.anyValid = true;
      } else {
        task.parameters.allValid = false;
      }
    }

    // Set convenience flags
    task.parameters.notAllValid = !task.parameters.allValid;
    task.parameters.notAnyValid = !task.parameters.anyValid;

    logger.debug(`Condition results - anyValid: ${task.parameters.anyValid}, allValid: ${task.parameters.allValid}`);
    callback(null, task);

  } catch (error) {
    logger.error(`Conditional handler error: ${error.message}`);
    callback(error, task);
  }
}