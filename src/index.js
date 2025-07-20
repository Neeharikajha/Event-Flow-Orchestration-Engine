// import { EventStormer } from './core/Engine.js';
// import fs from 'fs/promises';

// const stormer = new EventStormer('redis://localhost:6379');

// // Load a workflow
// const workflowYaml = await fs.readFile('./examples/userOnboarding.yaml', 'utf8');
// await stormer.defineWorkflow(workflowYaml);

// // Run it!
// await stormer.start('User Onboarding Flow', { userId: 'user123' });

import { EventStormer } from './core/Engine.js';
import fs from 'fs/promises';

// Step 1: Create the engine
const stormer = new EventStormer('redis://localhost:6379');

// Step 2: Define mock action implementations
const mockActions = {
  authService: {
    isVerified: async ({ userId }) => {
      console.log(`Checking if ${userId} is verified...`);
      return { verified: userId.includes('admin') }; // Only 'admin' users are "verified"
    }
  },
  dashboardService: {
    grantAccess: async ({ userId }) => {
      console.log(`📊 Granting dashboard access to ${userId}`);
    }
  },
  emailService: {
    sendVerification: async ({ userId }) => {
      console.log(`📧 Sending verification email to ${userId}`);
    }
  }
};

// Step 3: Hook actions into the engine
stormer.executeEvent = async (event, data) => {
  const [service, method] = event.action.split('.');
  const action = mockActions[service][method];
  return await action({ ...event.args, ...data });
};

// Step 4: Load the workflow YAML file
const workflowYaml = await fs.readFile('./examples/userOnboarding.yaml', 'utf8');
await stormer.defineWorkflow(workflowYaml);

// Step 5: Run it with a test user
await stormer.start('User Onboarding Flow', { userId: 'user123' });
// Output: 📧 Sending verification email to user123

await stormer.start('User Onboarding Flow', { userId: 'admin42' });
// Output: 📊 Granting dashboard access to admin42

