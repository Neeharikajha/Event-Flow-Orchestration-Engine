// engine/QueueManager.js
// BullMQ Integration for 1000+ distributed jobs/min with retry and priority control

import { Queue, Worker } from 'bullmq';
import { createClient } from 'redis';
import logger from './logger.js';

export class QueueManager {
  constructor(redisConfig = {}) {
    this.redisConfig = {
      host: redisConfig.host || process.env.REDIS_HOST || 'localhost',
      port: redisConfig.port || process.env.REDIS_PORT || 6379,
      maxRetriesPerRequest: null,
      ...redisConfig
    };

    this.connection = null;
    this.queues = new Map();
    this.workers = new Map();
    this.schedulers = new Map();
    this.metrics = {
      jobsProcessed: 0,
      jobsFailed: 0,
      avgProcessingTime: 0,
      throughput: 0
    };
    
    this.throughputInterval = null;
  }

  // Initialize connection
  async connect() {
    try {
      this.connection = createClient(this.redisConfig);
      await this.connection.connect();
      logger.info('✅ QueueManager connected to Redis');
      
      // Start throughput monitoring
      this.startThroughputMonitoring();
      
      return true;
    } catch (error) {
      logger.error(`❌ QueueManager connection failed: ${error.message}`);
      throw error;
    }
  }

  // Create or get queue
  getQueue(queueName, options = {}) {
    if (!this.queues.has(queueName)) {
      const queue = new Queue(queueName, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: options.attempts || 3,
          backoff: {
            type: options.backoffType || 'exponential',
            delay: options.backoffDelay || 2000
          },
          removeOnComplete: {
            age: 3600, // Keep completed jobs for 1 hour
            count: 1000 // Keep last 1000 completed jobs
          },
          removeOnFail: {
            age: 86400 // Keep failed jobs for 24 hours
          },
          ...options.jobOptions
        }
      });

      this.queues.set(queueName, queue);

      logger.info(`📋 Created queue: ${queueName}`);
    }

    return this.queues.get(queueName);
  }

  // Add job with priority control
  async addJob(queueName, jobName, data, options = {}) {
    const queue = this.getQueue(queueName, options);

    const jobOptions = {
      priority: options.priority || 0, // Lower number = higher priority
      delay: options.delay || 0,
      attempts: options.attempts || 3,
      backoff: options.backoff || {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: options.removeOnComplete !== false,
      removeOnFail: options.removeOnFail !== false,
      ...options
    };

    try {
      const job = await queue.add(jobName, data, jobOptions);
      logger.debug(`✅ Job added: ${jobName} (ID: ${job.id}, Priority: ${jobOptions.priority})`);
      return job;
    } catch (error) {
      logger.error(`❌ Failed to add job ${jobName}: ${error.message}`);
      throw error;
    }
  }

  // Add bulk jobs (optimized for high throughput)
  async addBulkJobs(queueName, jobs, options = {}) {
    const queue = this.getQueue(queueName, options);

    const formattedJobs = jobs.map(job => ({
      name: job.name,
      data: job.data,
      opts: {
        priority: job.priority || 0,
        attempts: job.attempts || 3,
        ...job.options
      }
    }));

    try {
      const addedJobs = await queue.addBulk(formattedJobs);
      logger.info(`✅ Added ${addedJobs.length} jobs in bulk to ${queueName}`);
      return addedJobs;
    } catch (error) {
      logger.error(`❌ Failed to add bulk jobs: ${error.message}`);
      throw error;
    }
  }

  // Create worker with concurrency control
  createWorker(queueName, processor, options = {}) {
    if (this.workers.has(queueName)) {
      logger.warn(`⚠️ Worker for ${queueName} already exists`);
      return this.workers.get(queueName);
    }

    const concurrency = options.concurrency || 10; // Process 10 jobs concurrently
    
    const worker = new Worker(
      queueName,
      async (job) => {
        const startTime = Date.now();
        logger.debug(`⚙️ Processing job ${job.id} - ${job.name}`);

        try {
          const result = await processor(job);
          const duration = Date.now() - startTime;
          
          // Update metrics
          this.metrics.jobsProcessed++;
          this.updateAvgProcessingTime(duration);
          
          logger.debug(`✅ Job ${job.id} completed in ${duration}ms`);
          return result;
        } catch (error) {
          this.metrics.jobsFailed++;
          logger.error(`❌ Job ${job.id} failed: ${error.message}`);
          throw error;
        }
      },
      {
        connection: this.connection,
        concurrency,
        limiter: options.limiter || {
          max: 1000, // Max 1000 jobs
          duration: 60000 // Per minute
        },
        ...options
      }
    );

    // Event handlers
    worker.on('completed', (job) => {
      logger.debug(`🎉 Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`💥 Job ${job?.id} failed: ${err.message}`);
    });

    worker.on('error', (err) => {
      logger.error(`🔥 Worker error: ${err.message}`);
    });

    worker.on('stalled', (jobId) => {
      logger.warn(`⏸️ Job ${jobId} stalled`);
    });

    this.workers.set(queueName, worker);
    logger.info(`👷 Created worker for ${queueName} with concurrency ${concurrency}`);

    return worker;
  }

  // Get queue statistics
  async getQueueStats(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.getPausedCount()
    ]);

    return {
      queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
      total: waiting + active + completed + failed + delayed
    };
  }

  // Get all queue statistics
  async getAllStats() {
    const stats = {};
    
    for (const [queueName] of this.queues) {
      stats[queueName] = await this.getQueueStats(queueName);
    }

    stats.global = {
      ...this.metrics,
      queues: this.queues.size,
      workers: this.workers.size
    };

    return stats;
  }

  // Monitor throughput (jobs/min)
  startThroughputMonitoring() {
    let lastCount = 0;
    
    this.throughputInterval = setInterval(() => {
      const currentCount = this.metrics.jobsProcessed;
      const throughput = currentCount - lastCount;
      this.metrics.throughput = throughput;
      lastCount = currentCount;
      
      if (throughput > 0) {
        logger.info(`📊 Throughput: ${throughput} jobs/min`);
      }
    }, 60000); // Every minute
  }

  // Update average processing time
  updateAvgProcessingTime(duration) {
    const total = this.metrics.jobsProcessed;
    const currentAvg = this.metrics.avgProcessingTime;
    this.metrics.avgProcessingTime = ((currentAvg * (total - 1)) + duration) / total;
  }

  // Retry failed jobs
  async retryFailedJobs(queueName, limit = 100) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const failedJobs = await queue.getFailed(0, limit);
    let retried = 0;

    for (const job of failedJobs) {
      try {
        await job.retry();
        retried++;
      } catch (error) {
        logger.error(`Failed to retry job ${job.id}: ${error.message}`);
      }
    }

    logger.info(`🔄 Retried ${retried} failed jobs in ${queueName}`);
    return retried;
  }

  // Clean old jobs
  async cleanQueue(queueName, grace = 3600000) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.clean(grace, 1000, 'completed');
    await queue.clean(grace, 1000, 'failed');
    
    logger.info(`🧹 Cleaned old jobs from ${queueName}`);
  }

  // Pause queue
  async pauseQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
    logger.info(`⏸️ Paused queue: ${queueName}`);
  }

  // Resume queue
  async resumeQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
    logger.info(`▶️ Resumed queue: ${queueName}`);
  }

  // Drain queue (remove all jobs)
  async drainQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.drain();
    logger.info(`🚽 Drained queue: ${queueName}`);
  }

  // Close all connections
  async close() {
    // Close all workers
    for (const [name, worker] of this.workers) {
      await worker.close();
      logger.info(`👷 Closed worker: ${name}`);
    }

    // Close all schedulers
    for (const [name, scheduler] of this.schedulers) {
      await scheduler.close();
      logger.info(`📅 Closed scheduler: ${name}`);
    }

    // Close all queues
    for (const [name, queue] of this.queues) {
      await queue.close();
      logger.info(`📋 Closed queue: ${name}`);
    }

    // Stop throughput monitoring
    if (this.throughputInterval) {
      clearInterval(this.throughputInterval);
    }

    // Close Redis connection
    if (this.connection) {
      await this.connection.quit();
      logger.info('✅ QueueManager disconnected from Redis');
    }
  }
}

export default QueueManager;