// ============================================
// ShopOpti+ Retry Manager v5.6.2
// Intelligent retry with exponential backoff
// ============================================

const ShopOptiRetryManager = {
  // Default configuration
  config: {
    maxRetries: 3,
    baseDelay: 1000,        // 1 second
    maxDelay: 30000,        // 30 seconds
    backoffMultiplier: 2,
    jitterPercent: 20,      // Add randomness to prevent thundering herd
    retryableErrors: [
      'RATE_LIMIT',
      'TIMEOUT',
      'NETWORK_ERROR',
      'SERVER_ERROR',
      'CAPTCHA_DETECTED',
      'DOM_CHANGED'
    ]
  },

  // Active retry tasks
  activeTasks: new Map(),

  /**
   * Calculate delay with exponential backoff + jitter
   */
  calculateDelay(attempt) {
    const { baseDelay, maxDelay, backoffMultiplier, jitterPercent } = this.config;
    
    // Exponential backoff
    let delay = baseDelay * Math.pow(backoffMultiplier, attempt);
    
    // Cap at max delay
    delay = Math.min(delay, maxDelay);
    
    // Add jitter
    const jitter = delay * (jitterPercent / 100) * (Math.random() - 0.5) * 2;
    delay += jitter;
    
    return Math.round(delay);
  },

  /**
   * Classify error for retry decision
   */
  classifyError(error) {
    const errorStr = String(error).toLowerCase();
    
    if (errorStr.includes('rate') || errorStr.includes('429') || errorStr.includes('too many')) {
      return { type: 'RATE_LIMIT', retryable: true, suggestedDelay: 5000 };
    }
    
    if (errorStr.includes('timeout') || errorStr.includes('timed out')) {
      return { type: 'TIMEOUT', retryable: true, suggestedDelay: 2000 };
    }
    
    if (errorStr.includes('network') || errorStr.includes('fetch') || errorStr.includes('connection')) {
      return { type: 'NETWORK_ERROR', retryable: true, suggestedDelay: 3000 };
    }
    
    if (errorStr.includes('500') || errorStr.includes('502') || errorStr.includes('503') || errorStr.includes('504')) {
      return { type: 'SERVER_ERROR', retryable: true, suggestedDelay: 5000 };
    }
    
    if (errorStr.includes('captcha') || errorStr.includes('robot') || errorStr.includes('verify')) {
      return { type: 'CAPTCHA_DETECTED', retryable: true, suggestedDelay: 10000 };
    }
    
    if (errorStr.includes('selector') || errorStr.includes('element') || errorStr.includes('not found')) {
      return { type: 'DOM_CHANGED', retryable: true, suggestedDelay: 2000 };
    }
    
    if (errorStr.includes('unauthorized') || errorStr.includes('401') || errorStr.includes('403')) {
      return { type: 'AUTH_ERROR', retryable: false };
    }
    
    if (errorStr.includes('not found') || errorStr.includes('404')) {
      return { type: 'NOT_FOUND', retryable: false };
    }
    
    return { type: 'UNKNOWN', retryable: false };
  },

  /**
   * Execute with retry logic
   */
  async withRetry(taskId, fn, options = {}) {
    const maxRetries = options.maxRetries ?? this.config.maxRetries;
    const onRetry = options.onRetry || (() => {});
    const onProgress = options.onProgress || (() => {});
    
    let lastError = null;
    let attempt = 0;
    
    // Track this task
    this.activeTasks.set(taskId, {
      status: 'running',
      attempt: 0,
      startedAt: Date.now()
    });
    
    while (attempt <= maxRetries) {
      try {
        onProgress({ attempt, maxRetries, status: 'attempting' });
        
        const result = await fn();
        
        // Success - clean up and return
        this.activeTasks.delete(taskId);
        return { success: true, data: result, attempts: attempt + 1 };
        
      } catch (error) {
        lastError = error;
        const classification = this.classifyError(error);
        
        console.warn(`[RetryManager] Task ${taskId} attempt ${attempt + 1} failed:`, {
          error: error.message,
          type: classification.type,
          retryable: classification.retryable
        });
        
        // Check if we should retry
        if (!classification.retryable || attempt >= maxRetries) {
          this.activeTasks.delete(taskId);
          return {
            success: false,
            error: error.message,
            errorType: classification.type,
            attempts: attempt + 1,
            retryable: classification.retryable
          };
        }
        
        // Calculate delay
        const delay = classification.suggestedDelay || this.calculateDelay(attempt);
        
        // Update task status
        this.activeTasks.set(taskId, {
          status: 'waiting',
          attempt: attempt + 1,
          nextRetryAt: Date.now() + delay,
          lastError: classification.type
        });
        
        // Notify about retry
        onRetry({
          attempt: attempt + 1,
          maxRetries,
          delay,
          errorType: classification.type,
          error: error.message
        });
        
        onProgress({ 
          attempt: attempt + 1, 
          maxRetries, 
          status: 'waiting',
          delay 
        });
        
        // Wait before retry
        await this.sleep(delay);
        attempt++;
      }
    }
    
    // Should not reach here, but just in case
    this.activeTasks.delete(taskId);
    return {
      success: false,
      error: lastError?.message || 'Max retries exceeded',
      attempts: attempt
    };
  },

  /**
   * Execute batch with retry for each item
   */
  async batchWithRetry(items, processFn, options = {}) {
    const { 
      concurrency = 3, 
      stopOnError = false,
      onItemComplete = () => {},
      onBatchProgress = () => {}
    } = options;
    
    const results = [];
    const errors = [];
    let completed = 0;
    
    // Process in chunks for concurrency control
    for (let i = 0; i < items.length; i += concurrency) {
      const chunk = items.slice(i, i + concurrency);
      
      const chunkPromises = chunk.map(async (item, index) => {
        const itemIndex = i + index;
        const taskId = `batch_${Date.now()}_${itemIndex}`;
        
        const result = await this.withRetry(taskId, () => processFn(item, itemIndex), options);
        
        completed++;
        onItemComplete({ item, result, index: itemIndex, total: items.length });
        onBatchProgress({ completed, total: items.length, percent: (completed / items.length) * 100 });
        
        if (result.success) {
          results.push({ item, data: result.data, index: itemIndex });
        } else {
          errors.push({ item, error: result.error, index: itemIndex });
          if (stopOnError) {
            throw new Error(`Batch stopped at item ${itemIndex}: ${result.error}`);
          }
        }
        
        return result;
      });
      
      await Promise.all(chunkPromises);
    }
    
    return {
      success: errors.length === 0,
      total: items.length,
      succeeded: results.length,
      failed: errors.length,
      results,
      errors
    };
  },

  /**
   * Cancel a running task
   */
  cancelTask(taskId) {
    if (this.activeTasks.has(taskId)) {
      this.activeTasks.set(taskId, { status: 'cancelled' });
      return true;
    }
    return false;
  },

  /**
   * Get task status
   */
  getTaskStatus(taskId) {
    return this.activeTasks.get(taskId) || null;
  },

  /**
   * Get all active tasks
   */
  getActiveTasks() {
    return Array.from(this.activeTasks.entries()).map(([id, status]) => ({
      id,
      ...status
    }));
  },

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Create a rate limiter
   */
  createRateLimiter(requestsPerMinute) {
    const interval = 60000 / requestsPerMinute;
    let lastRequest = 0;
    
    return async () => {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequest;
      
      if (timeSinceLastRequest < interval) {
        await this.sleep(interval - timeSinceLastRequest);
      }
      
      lastRequest = Date.now();
    };
  }
};

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiRetryManager = ShopOptiRetryManager;
}
