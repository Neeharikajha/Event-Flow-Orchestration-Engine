// engine/RetryFallbackSystem.js
// Advanced retry strategies and failure fallback mechanisms

import logger from './logger.js';

export class RetryFallbackSystem {
  constructor() {
    this.retryStrategies = {
      exponential: this.exponentialBackoff,
      linear: this.linearBackoff,
      fixed: this.fixedBackoff,
      fibonacci: this.fibonacciBackoff
    };

    this.fallbackHandlers = new Map();
  }

  // Exponential backoff: 2s, 4s, 8s, 16s...
  exponentialBackoff(attempt, baseDelay = 2000) {
    return Math.min(baseDelay * Math.pow(2, attempt - 1), 60000); // Max 60s
  }

  // Linear backoff: 2s, 4s, 6s, 8s...
  linearBackoff(attempt, baseDelay = 2000) {
    return Math.min(baseDelay * attempt, 30000); // Max 30s
  }

  // Fixed backoff: 3s, 3s, 3s...
  fixedBackoff(attempt, baseDelay = 3000) {
    return baseDelay;
  }

  // Fibonacci backoff: 1s, 1s, 2s, 3s, 5s, 8s...
  fibonacciBackoff(attempt, baseDelay = 1000) {
    let a = 1, b = 1;
    for (let i = 2; i < attempt; i++) {
      [a, b] = [b, a + b];
    }
    return Math.min(b * baseDelay, 30000); // Max 30s
  }

  // Execute with retry logic
  async executeWithRetry(fn, options = {}) {
    const {
      maxAttempts = 3,
      strategy = 'exponential',
      baseDelay = 2000,
      onRetry = null,
      timeout = 30000,
      shouldRetry = null // Custom retry condition
    } = options;

    const strategyFn = this.retryStrategies[strategy] || this.exponentialBackoff;
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logger.debug(`🔄 Attempt ${attempt}/${maxAttempts}`);

        // Execute with timeout
        const result = await this.executeWithTimeout(fn, timeout);
        
        logger.info(`✅ Succeeded on attempt ${attempt}`);
        return {
          success: true,
          result,
          attempts: attempt
        };

      } catch (error) {
        lastError = error;
        logger.warn(`❌ Attempt ${attempt} failed: ${error.message}`);

        // Check if we should retry
        if (shouldRetry && !shouldRetry(error, attempt)) {
          logger.info(`🛑 Stopping retries (shouldRetry returned false)`);
          break;
        }

        // Last attempt - don't delay
        if (attempt === maxAttempts) {
          break;
        }

        // Calculate delay
        const delay = strategyFn.call(this, attempt, baseDelay);
        logger.info(`⏳ Retrying in ${delay}ms...`);

        // Call retry hook
        if (onRetry) {
          await onRetry(attempt, error, delay);
        }

        // Wait before retry
        await this.sleep(delay);
      }
    }

    // All attempts failed
    logger.error(`💥 Failed after ${maxAttempts} attempts`);
    throw new Error(
      `Failed after ${maxAttempts} attempts. Last error: ${lastError.message}`
    );
  }

  // Execute with timeout
  async executeWithTimeout(fn, timeout) {
    return Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
      )
    ]);
  }

  // Register fallback handler
  registerFallback(taskName, fallbackFn) {
    this.fallbackHandlers.set(taskName, fallbackFn);
    logger.info(`📝 Registered fallback for: ${taskName}`);
  }

  // Execute with fallback
  async executeWithFallback(taskName, primaryFn, options = {}) {
    try {
      // Try primary execution with retry
      const result = await this.executeWithRetry(primaryFn, options);
      return result;

    } catch (primaryError) {
      logger.error(`❌ Primary execution failed: ${primaryError.message}`);

      // Check if fallback exists
      const fallbackFn = this.fallbackHandlers.get(taskName);
      
      if (!fallbackFn) {
        logger.warn(`⚠️ No fallback registered for ${taskName}`);
        throw primaryError;
      }

      logger.info(`🔄 Executing fallback for ${taskName}`);

      try {
        // Execute fallback (no retry for fallback by default)
        const fallbackResult = await fallbackFn(primaryError);
        
        return {
          success: true,
          result: fallbackResult,
          usedFallback: true,
          primaryError: primaryError.message
        };

      } catch (fallbackError) {
        logger.error(`💥 Fallback failed: ${fallbackError.message}`);
        throw new Error(
          `Both primary and fallback failed. ` +
          `Primary: ${primaryError.message}, ` +
          `Fallback: ${fallbackError.message}`
        );
      }
    }
  }

  // Circuit breaker pattern
  createCircuitBreaker(name, fn, options = {}) {
    const {
      failureThreshold = 5,
      resetTimeout = 60000,
      halfOpenAttempts = 3
    } = options;

    let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    let failures = 0;
    let lastFailureTime = null;
    let halfOpenAttempted = 0;

    return async (...args) => {
      // Check if circuit should reset
      if (state === 'OPEN' && Date.now() - lastFailureTime > resetTimeout) {
        logger.info(`🔄 Circuit breaker ${name} entering HALF_OPEN state`);
        state = 'HALF_OPEN';
        failures = 0;
        halfOpenAttempted = 0;
      }

      // Reject immediately if circuit is open
      if (state === 'OPEN') {
        throw new Error(`Circuit breaker ${name} is OPEN`);
      }

      try {
        const result = await fn(...args);

        // Success - reset circuit
        if (state === 'HALF_OPEN') {
          halfOpenAttempted++;
          
          if (halfOpenAttempted >= halfOpenAttempts) {
            logger.info(`✅ Circuit breaker ${name} CLOSED`);
            state = 'CLOSED';
            failures = 0;
          }
        }

        return result;

      } catch (error) {
        failures++;
        lastFailureTime = Date.now();

        if (failures >= failureThreshold) {
          logger.error(`🔥 Circuit breaker ${name} OPEN after ${failures} failures`);
          state = 'OPEN';
        }

        throw error;
      }
    };
  }

  // Bulk retry with partial success handling
  async retryBulk(operations, options = {}) {
    const {
      maxAttempts = 3,
      continueOnError = true,
      parallelism = 5
    } = options;

    const results = [];
    const failed = [];

    // Process in batches for parallelism control
    for (let i = 0; i < operations.length; i += parallelism) {
      const batch = operations.slice(i, i + parallelism);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (op, index) => {
          try {
            const result = await this.executeWithRetry(op.fn, {
              maxAttempts,
              ...op.options
            });
            return { index: i + index, success: true, result };
          } catch (error) {
            return { index: i + index, success: false, error: error.message };
          }
        })
      );

      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results.push(result.value);
          } else {
            failed.push(result.value);
            if (!continueOnError) {
              throw new Error(`Operation ${result.value.index} failed`);
            }
          }
        }
      });
    }

    return {
      successful: results.length,
      failed: failed.length,
      results,
      failures: failed
    };
  }

  // Compensating transaction (rollback on failure)
  async executeWithCompensation(operations) {
    const completed = [];
    const compensations = [];

    try {
      for (const op of operations) {
        const result = await op.execute();
        completed.push(result);
        
        if (op.compensate) {
          compensations.push(op.compensate);
        }
      }

      return { success: true, results: completed };

    } catch (error) {
      logger.error(`❌ Operation failed, running compensations: ${error.message}`);

      // Run compensations in reverse order
      for (let i = compensations.length - 1; i >= 0; i--) {
        try {
          await compensations[i]();
          logger.info(`✅ Compensation ${i} succeeded`);
        } catch (compError) {
          logger.error(`💥 Compensation ${i} failed: ${compError.message}`);
        }
      }

      throw error;
    }
  }

  // Helper: sleep
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get retry statistics
  getStats() {
    return {
      fallbackHandlers: this.fallbackHandlers.size,
      strategies: Object.keys(this.retryStrategies)
    };
  }
}

export default RetryFallbackSystem;