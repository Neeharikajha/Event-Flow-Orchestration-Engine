// engine/persistence/config.js
// Fixed: CommonJS → ES6 modules, improved defaults

// Fetch and set default env vars with fallbacks
const type = process.env.DB_TYPE || "file";
const dataDirectory = process.env.DB_DIR || "_data";
const dataHost = process.env.DB_HOST || "localhost";
const dataPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 27017;

// Configuration object
export const config = {
  type,           // "file" or "mongo"
  dataDirectory,  // Default: "_data"
  host: dataHost, // Default: "localhost"
  port: dataPort  // Default: 27017 (MongoDB default port)
};

// Validation function
export function validateConfig() {
  const errors = [];

  if (!["file", "mongo"].includes(config.type)) {
    errors.push(`Invalid DB_TYPE: ${config.type}. Must be "file" or "mongo"`);
  }

  if (config.type === "mongo" && !config.port) {
    errors.push("DB_PORT is required for MongoDB storage");
  }

  if (config.type === "file" && !config.dataDirectory) {
    errors.push("DB_DIR is required for file storage");
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }

  return true;
}

// Log current configuration
export function logConfig() {
  console.log('📋 Persistence Configuration:');
  console.log(`   Type: ${config.type}`);
  console.log(`   Data Directory: ${config.dataDirectory}`);
  if (config.type === "mongo") {
    console.log(`   MongoDB Host: ${config.host}:${config.port}`);
  }
}

// Default export
export default {
  config,
  validateConfig,
  logConfig
};