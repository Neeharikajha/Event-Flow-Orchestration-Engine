// engine/WorkflowQueue.js
// Integration layer between Processus engine and BullMQ for distributed workflow execution

import QueueManager from './QueueManager.js';
import * as processus from './processus.js';
import logger from './logger.js';

export class WorkflowQueue {
  constructor(redisConfig = {}) {
    this.queueManager = new QueueManager(redisConfig);
    this.workflowQueue = 'workflows';
    this.taskQueue = 'workflow-tasks';
    this.initialized = false;
  }

  // Initialize queue system
  async initialize() {
    if (this.initialized) {
      logger.warn('WorkflowQueue already initialized');
      return;
    }

    await this.queueManager.connect();

    // Create workflow processing worker
    this.queueManager.createWorker(
      this.workflowQueue,
      async (job) => await this.processWorkflow(job),
      {
        concurrency: 50, // Process 50 workflows concurrently
        limiter: {
          max: 1000,
          duration: 60000 // 1000 workflows per minute
        }
      }
    );

    // Create task processing worker
    this.queueManager.createWorker(
      this.taskQueue,
      async (job) => await this.processTask(job),
      {
        concurrency: 100, // Process 100 tasks concurrently
        limiter: {
          max: 2000,
          duration: 60000 // 2000 tasks per minute
        }
      }
    );

    this.initialized = true;
    logger.info('✅ WorkflowQueue initialized');
  }

  // Queue a workflow for execution
  async queueWorkflow(workflowDef, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const jobData = {
      workflow: workflowDef,
      defId: workflowDef.name || 'unnamed',
      timestamp: Date.now(),
      metadata: options.metadata || {}
    };

    const jobOptions = {
      priority: options.priority || 0,
      attempts: options.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: options.retryDelay || 5000
      },
      timeout: options.timeout || 300000 // 5 minutes default
    };

    try {
      const job = await this.queueManager.addJob(
        this.workflowQueue,
        `workflow-${workflowDef.name}`,
        jobData,
        jobOptions
      );

      logger.info(`📋 Queued workflow: ${workflowDef.name} (Job ID: ${job.id})`);
      return {
        jobId: job.id,
        queueName: this.workflowQueue,
        workflowName: workflowDef.name
      };
    } catch (error) {
      logger.error(`❌ Failed to queue workflow: ${error.message}`);
      throw error;
    }
  }

  // Queue multiple workflows in bulk
  async queueWorkflowsBulk(workflows, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const jobs = workflows.map((workflow, index) => ({
      name: `workflow-${workflow.name || index}`,
      data: {
        workflow,
        defId: workflow.name || 'unnamed',
        timestamp: Date.now()
      },
      priority: options.priority || 0,
      attempts: options.attempts || 3
    }));

    try {
      const addedJobs = await this.queueManager.addBulkJobs(
        this.workflowQueue,
        jobs,
        options
      );

      logger.info(`📋 Queued ${addedJobs.length} workflows in bulk`);
      return addedJobs.map(job => ({
        jobId: job.id,
        workflowName: job.data.workflow.name
      }));
    } catch (error) {
      logger.error(`❌ Failed to queue bulk workflows: ${error.message}`);
      throw error;
    }
  }

  // Process workflow job
  async processWorkflow(job) {
    const { workflow, defId } = job.data;
    
    logger.info(`🚀 Processing workflow: ${defId} (Job ${job.id})`);

    return new Promise((resolve, reject) => {
      processus.runWorkflow(defId, null, workflow, (err, result) => {
        if (err) {
          logger.error(`❌ Workflow ${defId} failed: ${err.message}`);
          reject(err);
          return;
        }

        logger.info(`✅ Workflow ${defId} completed (ID: ${result.id})`);
        resolve({
          workflowId: result.id,
          status: result.status,
          defId
        });
      });
    });
  }

  // Queue individual task
  async queueTask(taskData, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const jobOptions = {
      priority: options.priority || 0,
      attempts: options.attempts || 3,
      backoff: {
        type: options.backoffType || 'exponential',
        delay: options.backoffDelay || 2000
      }
    };

    try {
      const job = await this.queueManager.addJob(
        this.taskQueue,
        `task-${taskData.taskName}`,
        taskData,
        jobOptions
      );

      return job;
    } catch (error) {
      logger.error(`❌ Failed to queue task: ${error.message}`);
      throw error;
    }
  }

  // Process task job
  async processTask(job) {
    const { workflowId, taskName, task } = job.data;
    
    logger.debug(`⚙️ Processing task: ${taskName} (Job ${job.id})`);

    // Task processing logic would go here
    // This is a placeholder - actual implementation depends on your task handlers
    
    return {
      taskName,
      status: 'completed',
      workflowId
    };
  }

  // Get workflow job status
  async getJobStatus(jobId) {
    const queue = this.queueManager.queues.get(this.workflowQueue);
    if (!queue) {
      throw new Error('Workflow queue not initialized');
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress;
    const data = job.data;

    return {
      jobId: job.id,
      name: job.name,
      state,
      progress,
      data,
      attempts: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason
    };
  }

  // Get queue statistics
  async getStats() {
    return await this.queueManager.getAllStats();
  }

  // Retry failed workflows
  async retryFailedWorkflows(limit = 100) {
    return await this.queueManager.retryFailedJobs(this.workflowQueue, limit);
  }

  // Pause workflow processing
  async pauseProcessing() {
    await this.queueManager.pauseQueue(this.workflowQueue);
    await this.queueManager.pauseQueue(this.taskQueue);
  }

  // Resume workflow processing
  async resumeProcessing() {
    await this.queueManager.resumeQueue(this.workflowQueue);
    await this.queueManager.resumeQueue(this.taskQueue);
  }

  // Clean old jobs
  async cleanup(grace = 3600000) {
    await this.queueManager.cleanQueue(this.workflowQueue, grace);
    await this.queueManager.cleanQueue(this.taskQueue, grace);
  }

  // Close all connections
  async close() {
    await this.queueManager.close();
    this.initialized = false;
    logger.info('✅ WorkflowQueue closed');
  }
}

export default WorkflowQueue;