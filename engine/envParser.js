// // export function parse(rawWorkflow){
// //     const str = String(rawWorkflow ?? "");
// //     const envRegex = /\$env\[(.+?)\]/g;

// //     return str.replace(envRegex, (match, varName){

// //         const value = process.env[varName];
// //         return value === undefined ? ' ': String(value);
// //     })
// // }




// // // what this does ? :
// // // if my raw-workflow is : "My key is $env[some_var]"
// // // and in my system i have some_var = 1234, then after parsing it will give : My key is 1234

// // envParser.js
// // Modern ES6 implementation (deprecated in favor of workflow.environment:{})

// /**
//  * DEPRECATED: This module is deprecated in favor of workflow.environment:{} 
//  * being referenceable directly in workflows.
//  * 
//  * Parse workflow for environment variables in the format $env[<ENV_VAR>]
//  * and replace them with actual environment variable values.
//  * 
//  * @deprecated Use workflow.environment object instead
//  */

// import logger from './logger.js';

// /**
//  * Parse raw workflow text and replace environment variable references
//  * @param {string} rawWorkflow - Raw workflow text containing $env[VAR] references
//  * @returns {string} - Parsed workflow with env vars replaced
//  * @deprecated
//  */
// export function parse(rawWorkflow) {
//   if (!rawWorkflow) {
//     logger.warn('envParser.parse called with empty workflow');
//     return rawWorkflow;
//   }

//   let str = String(rawWorkflow);

//   // Look for all instances of '$env[<ENV_VAR>]'
//   // Updated regex to be more robust
//   const envMatches = str.match(/\$env\[([^\]]+)\]/g);

//   if (!envMatches || envMatches.length === 0) {
//     return str;
//   }

//   // Cycle through fetching the env value and replacing
//   for (const envRef of envMatches) {
//     try {
//       // Strip out '$env[' and ']' to get the variable name
//       const envKey = envRef.slice(5, -1);
      
//       // Get environment variable value
//       const envValue = process.env[envKey];

//       if (envValue === undefined) {
//         logger.warn(`Environment variable not found: ${envKey}`);
//         // Keep the reference if env var doesn't exist
//         continue;
//       }

//       // Replace all occurrences of this env reference
//       str = str.replace(new RegExp(escapeRegExp(envRef), 'g'), envValue);
      
//       logger.debug(`Replaced ${envRef} with value from environment`);
//     } catch (err) {
//       logger.error(`Error parsing env variable ${envRef}: ${err.message}`);
//     }
//   }

//   return str;
// }

// /**
//  * Parse workflow object and replace env vars in all string properties
//  * @param {Object} workflowObj - Workflow object
//  * @returns {Object} - Workflow with env vars replaced
//  * @deprecated
//  */
// export function parseObject(workflowObj) {
//   if (!workflowObj || typeof workflowObj !== 'object') {
//     return workflowObj;
//   }

//   const jsonStr = JSON.stringify(workflowObj);
//   const parsedStr = parse(jsonStr);
  
//   try {
//     return JSON.parse(parsedStr);
//   } catch (err) {
//     logger.error(`Failed to parse workflow after env replacement: ${err.message}`);
//     return workflowObj;
//   }
// }

// /**
//  * Escape special regex characters in a string
//  * @param {string} str - String to escape
//  * @returns {string} - Escaped string
//  */
// function escapeRegExp(str) {
//   return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// }

// /**
//  * Get all environment variable references in a workflow
//  * @param {string} rawWorkflow - Raw workflow text
//  * @returns {Array<string>} - Array of env var names referenced
//  */
// export function getEnvVarReferences(rawWorkflow) {
//   if (!rawWorkflow) return [];

//   const str = String(rawWorkflow);
//   const envMatches = str.match(/\$env\[([^\]]+)\]/g);

//   if (!envMatches) return [];

//   return envMatches.map(match => match.slice(5, -1));
// }

// /**
//  * Validate that all required environment variables are set
//  * @param {string} rawWorkflow - Raw workflow text
//  * @returns {Object} - { valid: boolean, missing: string[] }
//  */
// export function validateEnvVars(rawWorkflow) {
//   const references = getEnvVarReferences(rawWorkflow);
//   const missing = references.filter(ref => process.env[ref] === undefined);

//   return {
//     valid: missing.length === 0,
//     missing,
//     references
//   };
// }

// /**
//  * Modern replacement: Use workflow.environment object
//  * This is the preferred approach for accessing environment variables
//  * 
//  * Example workflow:
//  * {
//  *   "name": "My Workflow",
//  *   "tasks": {
//  *     "task1": {
//  *       "handler": "$[environment.HANDLER_PATH]"
//  *     }
//  *   }
//  * }
//  */
// export function modernApproachExample() {
//   return {
//     message: 'Use workflow.environment:{} for environment variables',
//     example: {
//       name: 'Example Workflow',
//       environment: process.env,
//       tasks: {
//         task1: {
//           handler: '$[environment.MY_HANDLER]',
//           parameters: {
//             apiUrl: '$[environment.API_URL]'
//           }
//         }
//       }
//     }
//   };
// }

// // Log deprecation warning on import
// logger.warn('⚠️ envParser module is deprecated. Use workflow.environment:{} instead.');

// // Default export
// export default {
//   parse,
//   parseObject,
//   getEnvVarReferences,
//   validateEnvVars,
//   modernApproachExample
// };