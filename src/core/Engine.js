// import yaml from 'yaml';
// import Joi from 'joi';
// import { createClient } from 'redis';


// export class EventStormer {
//   constructor(redisUrl) {
//     this.redis = createClient({ url: redisUrl });
//     this.workflows = new Map(); // Stores registered workflows
//   }

//   // Load workflow from YAML/JSON
//   async defineWorkflow(workflowYaml) {
//     const workflow = yaml.parse(workflowYaml);
//     this.validateWorkflow(workflow); // Throw error if invalid
//     this.workflows.set(workflow.name, workflow);
//     console.log(`🌀 Loaded workflow: ${workflow.name}`);
//   }

//   // Validate workflow schema
//   validateWorkflow(workflow) {
//     const schema = Joi.object({
//       name: Joi.string().required(),
//       events: Joi.array().items(
//         Joi.object({
//           id: Joi.string().required(),
//           action: Joi.string().required(),
//           args: Joi.object().optional(),
//           next: Joi.array().optional()
//         })
//       ).required()
//     });
//     const { error } = schema.validate(workflow);
//     if (error) throw new Error(`Invalid workflow: ${error.message}`);
//   }

//   // Execute a workflow
//   async start(workflowName, initialData) {
//     const workflow = this.workflows.get(workflowName);
//     if (!workflow) throw new Error(`Workflow ${workflowName} not found!`);
    
//     for (const event of workflow.events) {
//       await this.executeEvent(event, initialData);
//     }
//   }

//   // Execute a single event (mock for now)
//   async executeEvent(event, data) {
//     console.log(`⚡ Running ${event.id} with args:`, event.args);
//     // TODO: Replace with actual action execution
//     return { success: true };
//   }
// }


import yaml from 'yaml';
import Joi from 'joi';
import { createClient } from 'redis';

export class EventStormer {
  constructor(redisUrl) {
    this.redis = createClient({ url: redisUrl });
    this.redis.on('error', (err) => console.error('❌ Redis error:', err));
    this.workflows = new Map(); // Stores registered workflows
  }

  async connect() {
    await this.redis.connect();
    console.log('✅ Connected to Redis');
  }

  // Load workflow from YAML/JSON
  async defineWorkflow(workflowYaml) {
    const workflow = yaml.parse(workflowYaml);
    this.validateWorkflow(workflow); // Throw error if invalid
    this.workflows.set(workflow.name, workflow);
    console.log(`🌀 Loaded workflow: ${workflow.name}`);
  }

  // Validate workflow schema
  validateWorkflow(workflow) {
    const schema = Joi.object({
      name: Joi.string().required(),
      events: Joi.array().items(
        Joi.object({
          id: Joi.string().required(),
          action: Joi.string().required(),
          args: Joi.object().optional(),
          next: Joi.array().optional()
        })
      ).required()
    });
    const { error } = schema.validate(workflow);
    if (error) throw new Error(`Invalid workflow: ${error.message}`);
  }

  // 🔁 Conditional Workflow Execution
  async start(workflowName, initialData) {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) throw new Error(`Workflow ${workflowName} not found!`);

    let currentEvent = workflow.events[0]; // start from the first event
    let eventData = { ...initialData };

    while (currentEvent) {
      const result = await this.executeEvent(currentEvent, eventData);
      eventData.output = result;

      currentEvent = this.getNextEvent(workflow, currentEvent, result);
    }
  }

  // 🧠 Decides next event based on 'next' conditions
  // getNextEvent(workflow, currentEvent, result) {
  //   if (!currentEvent.next) return null;

  //   for (const rule of currentEvent.next) {
  //     const condition = rule.if.replace(/{{(.*?)}}/g, (_, path) => {
  //       return path.split('.').reduce((obj, key) => obj[key], { output: result });
  //     });

  //     if (eval(condition)) { // ⚠️ unsafe in prod
  //       return workflow.events.find(e => e.id === rule.then);
  //     }
  //   }
  //   return null;
  // }
  getNextEvent(workflow, currentEvent, result) {
  if (!currentEvent.next) return null;

  for (const rule of currentEvent.next) {
    try {
      const condition = rule.if.replace(/{{(.*?)}}/g, (_, path) => {
        // Traverse safely to avoid undefined errors
        const value = path.split('.').reduce((obj, key) => {
          if (obj && typeof obj === 'object' && key in obj) {
            return obj[key];
          } else {
            console.warn(`⚠️ Path "${path}" not found in result.`);
            return undefined;
          }
        }, { output: result });

        return typeof value === 'string' ? `"${value}"` : value;
      });

      if (eval(condition)) { // ⚠️ still unsafe, but works for dev
        return workflow.events.find(e => e.id === rule.then);
      }
    } catch (err) {
      console.error(`🔥 Error evaluating condition "${rule.if}":`, err.message);
    }
  }

  return null;
}


  // Executes a single event (mock for now)
  async executeEvent(event, data) {
    console.log(`⚡ Running ${event.id} with args:`, event.args);
    // TODO: Replace with actual action execution
    return { success: true };
  }
}
