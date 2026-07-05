// engine/ProcessusEngine.js
// Fully integrated Processus engine with BullMQ, retry, and fallback

import * as processus from './processus.js';
import store from './persistence/store.js';
import WorkflowQueue from './WorkflowQueue.js';
import RetryFallbackSystem from './RetryFallbackSystem.js';
import logger from './logger.js';

export class ProcessusEngine {
  constructor(config = {}) {
    this.config = {
      useQueue: config.useQueue !== false, // Default: true
      redis: {
        host: config.redisHost || process.env.REDIS_HOST || 'localhost',
        port: config.redisPort || process.env.REDIS_PORT || 6379
      },
      retry: {
        maxAttempts: config.maxRetryAttempts || 3,
        strategy: config.retryStrategy || 'exponential',
        baseDelay: config.retryBaseDelay || 2000
      },
      queue: {
        workflowConcurrency: config.workflowConcurrency || 50,
        taskConcurrency: config.taskConcurrency || 100
      }
    };

    this.workflowQueue = null;
    this.retrySystem = new RetryFallbackSystem();
    this.initialized = false;
  }

  // Initialize the engine
  async initialize() {
    if (this.initialized) {
      logger.warn('ProcessusEngine already initialized');
      return;
    }

    try {
      // Initialize persistence store
      await new Promise((resolve, reject) => {
        store.initStore((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      logger.info('✅ Persistence store initialized');

      // Initialize queue system if enabled
      if (this.config.useQueue) {
        this.workflowQueue = new WorkflowQueue(this.config.redis);
        await this.workflowQueue.initialize();
        logger.info('✅ Queue system initialized');
      }

      this.initialized = true;
      logger.info('🚀 ProcessusEngine fully initialized');
    } catch (error) {
      logger.error(`❌ Failed to initialize ProcessusEngine: ${error.message}`);
      throw error;
    }
  }

  // Execute workflow (direct or queued)
  async executeWorkflow(workflowDef, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      useQueue = this.config.useQueue,
      priority = 0,
      retry = true,
      fallback = null,
      metadata = {}
    } = options;

    // Queue execution
    if (useQueue && this.workflowQueue) {
      return await this.executeWorkflowQueued(workflowDef, {
        priority,
        metadata,
        attempts: retry ? this.config.retry.maxAttempts : 1
      });
    }

    // Direct execution with retry/fallback
    if (retry) {
      return await this.executeWorkflowWithRetry(workflowDef, fallback);
    }

    // Simple direct execution
    return await this.executeWorkflowDirect(workflowDef);
  }

  // Execute workflow directly (original Processus way)
  async executeWorkflowDirect(workflowDef) {
    logger.info(`🚀 Executing workflow directly: ${workflowDef.name || 'unnamed'}`);

    return new Promise((resolve, reject) => {
      processus.runWorkflow(
        workflowDef.name || 'unnamed',
        null,
        workflowDef,
        (err, result) => {
          if (err) {
            logger.error(`❌ Workflow failed: ${err.message}`);
            reject(err);
          } else {
            logger.info(`✅ Workflow completed: ${result.id}`);
            resolve(result);
          }
        }
      );
    });
  }

  // Execute workflow with retry logic
  async executeWorkflowWithRetry(workflowDef, fallback = null) {
    logger.info(`🔄 Executing workflow with retry: ${workflowDef.name || 'unnamed'}`);

    const workflowFn = async () => await this.executeWorkflowDirect(workflowDef);

    if (fallback) {
      // Execute with fallback
      return await this.retrySystem.executeWithFallback(
        workflowDef.name || 'unnamed',
        workflowFn,
        {
          maxAttempts: this.config.retry.maxAttempts,
          strategy: this.config.retry.strategy,
          baseDelay: this.config.retry.baseDelay,
          onRetry: (attempt, error, delay) => {
            logger.warn(
              `⏳ Workflow retry ${attempt}/${this.config.retry.maxAttempts} ` +
              `in ${delay}ms: ${error.message}`
            );
          }
        }
      );
    }

    // Execute with retry only
    return await this.retrySystem.executeWithRetry(workflowFn, {
      maxAttempts: this.config.retry.maxAttempts,
      strategy: this.config.retry.strategy,
      baseDelay: this.config.retry.baseDelay
    });
  }

  // Execute workflow via queue
  async executeWorkflowQueued(workflowDef, options = {}) {
    logger.info(`📋 Queueing workflow: ${workflowDef.name || 'unnamed'}`);

    const result = await this.workflowQueue.queueWorkflow(workflowDef, options);
    
    logger.info(
      `✅ Workflow queued: ${result.workflowName} ` +
      `(Job ID: ${result.jobId}, Priority: ${options.priority || 0})`
    );

    return {
      queued: true,
      jobId: result.jobId,
      workflowName: result.workflowName,
      queueName: result.queueName
    };
  }

  // Execute multiple workflows in bulk
  async executeBulk(workflows, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      useQueue = this.config.useQueue,
      parallel = true,
      maxParallel = 10
    } = options;

    if (useQueue && this.workflowQueue) {
      // Queue all workflows in bulk
      return await this.workflowQueue.queueWorkflowsBulk(workflows, options);
    }

    // Direct execution
    if (parallel) {
      // Execute in parallel with concurrency control
      const results = [];
      for (let i = 0; i < workflows.length; i += maxParallel) {
        const batch = workflows.slice(i, i + maxParallel);
        const batchResults = await Promise.allSettled(
          batch.map(wf => this.executeWorkflow(wf, { ...options, useQueue: false }))
        );
        results.push(...batchResults);
      }
      return results;
    }

    // Sequential execution
    const results = [];
    for (const workflow of workflows) {
      try {
        const result = await this.executeWorkflow(workflow, { ...options, useQueue: false });
        results.push({ status: 'fulfilled', value: result });
      } catch (error) {
        results.push({ status: 'rejected', reason: error });
      }
    }
    return results;
  }

  // Register fallback for workflow
  registerFallback(workflowName, fallbackFn) {
    this.retrySystem.registerFallback(workflowName, fallbackFn);
    logger.info(`📝 Registered fallback for workflow: ${workflowName}`);
  }

  // Get workflow status (queued or completed)
  async getWorkflowStatus(workflowIdOrJobId, isJobId = false) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (isJobId && this.workflowQueue) {
      // Get job status from queue
      return await this.workflowQueue.getJobStatus(workflowIdOrJobId);
    }

    // Get workflow from persistence
    return new Promise((resolve, reject) => {
      store.loadInstance(workflowIdOrJobId, 0, (err, workflow) => {
        if (err) reject(err);
        else resolve(workflow);
      });
    });
  }

  // Get system statistics
  async getStats() {
    if (!this.initialized) {
      return { error: 'Engine not initialized' };
    }

    const stats = {
      initialized: this.initialized,
      config: this.config,
      retry: this.retrySystem.getStats()
    };

    if (this.workflowQueue) {
      stats.queue = await this.workflowQueue.getStats();
    }

    return stats;
  }

  // Pause workflow processing
  async pause() {
    if (this.workflowQueue) {
      await this.workflowQueue.pauseProcessing();
      logger.info('⏸️ Workflow processing paused');
    }
  }

  // Resume workflow processing
  async resume() {
    if (this.workflowQueue) {
      await this.workflowQueue.resumeProcessing();
      logger.info('▶️ Workflow processing resumed');
    }
  }

  // Retry failed workflows
  async retryFailed(limit = 100) {
    if (!this.workflowQueue) {
      logger.warn('⚠️ Queue not enabled, cannot retry failed workflows');
      return 0;
    }

    const retried = await this.workflowQueue.retryFailedWorkflows(limit);
    logger.info(`🔄 Retried ${retried} failed workflows`);
    return retried;
  }

  // Clean old jobs
  async cleanup(graceMs = 3600000) {
    if (this.workflowQueue) {
      await this.workflowQueue.cleanup(graceMs);
      logger.info('🧹 Cleanup completed');
    }
  }

  // Shutdown gracefully
  async shutdown() {
    logger.info('🛑 Shutting down ProcessusEngine...');

    if (this.workflowQueue) {
      await this.workflowQueue.close();
    }

    await new Promise((resolve) => {
      store.exitStore(() => resolve());
    });

    this.initialized = false;
    logger.info('✅ ProcessusEngine shutdown complete');
  }
}

// Export singleton instance
let engineInstance = null;

export function getEngine(config) {
  if (!engineInstance) {
    engineInstance = new ProcessusEngine(config);
  }
  return engineInstance;
}

export default ProcessusEngine;