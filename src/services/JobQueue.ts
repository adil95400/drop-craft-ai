import { ImportJob, JobQueue } from '@/types/suppliers';
import { supabase } from '@/integrations/supabase/client';

export class JobQueueManager {
  private static instance: JobQueueManager;
  private queues: Map<string, JobQueue> = new Map();
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeQueues();
  }

  static getInstance(): JobQueueManager {
    if (!JobQueueManager.instance) {
      JobQueueManager.instance = new JobQueueManager();
    }
    return JobQueueManager.instance;
  }

  private initializeQueues() {
    // Create default queues
    this.queues.set('imports', {
      id: 'imports',
      name: 'Product Imports',
      description: 'Product import and sync jobs',
      jobs: [],
      isActive: true,
      concurrency: 3,
      retryAttempts: 3,
      retryDelay: 30000, // 30 seconds
    });

    this.queues.set('orders', {
      id: 'orders',
      name: 'Order Processing',
      description: 'Order creation and tracking jobs',
      jobs: [],
      isActive: true,
      concurrency: 5,
      retryAttempts: 2,
      retryDelay: 15000, // 15 seconds
    });

    this.queues.set('sync', {
      id: 'sync',
      name: 'Data Synchronization',
      description: 'Inventory and price sync jobs',
      jobs: [],
      isActive: true,
      concurrency: 2,
      retryAttempts: 5,
      retryDelay: 60000, // 1 minute
    });
  }

  async addJob(
    queueName: string,
    jobData: Omit<ImportJob, 'id' | 'status' | 'progress' | 'processedItems' | 'successCount' | 'errorCount' | 'errors'>
  ): Promise<string> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue "${queueName}" not found`);
    }

    const job: ImportJob = {
      ...jobData,
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'queued',
      progress: 0,
      processedItems: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };

    queue.jobs.push(job);
    
    // Save to database
    await this.saveJobToDatabase(job);
    
    // Start processing if not already running
    this.startProcessing();
    
    return job.id;
  }

  async getJob(jobId: string): Promise<ImportJob | null> {
    for (const queue of this.queues.values()) {
      const job = queue.jobs.find(j => j.id === jobId);
      if (job) return job;
    }
    return null;
  }

  async getQueueJobs(queueName: string): Promise<ImportJob[]> {
    const queue = this.queues.get(queueName);
    return queue ? [...queue.jobs] : [];
  }

  async updateJobProgress(
    jobId: string,
    progress: number,
    processedItems: number,
    successCount: number,
    errorCount: number,
    errors: string[] = []
  ): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) return;

    job.progress = progress;
    job.processedItems = processedItems;
    job.successCount = successCount;
    job.errorCount = errorCount;
    job.errors = errors;

    await this.updateJobInDatabase(job);
  }

  async completeJob(jobId: string, success: boolean = true): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) return;

    job.status = success ? 'completed' : 'failed';
    job.completedAt = new Date();
    job.progress = 100;

    await this.updateJobInDatabase(job);
    
    // Remove completed jobs after 24 hours
    setTimeout(() => {
      this.removeJobFromQueue(jobId);
    }, 24 * 60 * 60 * 1000);
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job || job.status === 'running') return;

    job.status = 'cancelled';
    await this.updateJobInDatabase(job);
  }

  private startProcessing(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.processingInterval = setInterval(() => {
      this.processQueues();
    }, 5000); // Check every 5 seconds
  }

  private stopProcessing(): void {
    this.isProcessing = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  private async processQueues(): Promise<void> {
    for (const queue of this.queues.values()) {
      if (!queue.isActive) continue;

      const runningJobs = queue.jobs.filter(job => job.status === 'running').length;
      if (runningJobs >= queue.concurrency) continue;

      // Get next queued job
      const nextJob = queue.jobs
        .filter(job => job.status === 'queued')
        .sort((a, b) => {
          const priorityOrder = { high: 3, normal: 2, low: 1 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          return a.scheduledAt.getTime() - b.scheduledAt.getTime();
        })[0];

      if (nextJob) {
        await this.executeJob(nextJob);
      }
    }
  }

  private async executeJob(job: ImportJob): Promise<void> {
    try {
      job.status = 'running';
      job.startedAt = new Date();
      await this.updateJobInDatabase(job);

      // Here you would implement the actual job execution
      // For now, we'll simulate job processing
      await this.simulateJobExecution(job);

    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      job.status = 'failed';
      job.errors.push(error.message);
      job.completedAt = new Date();
      await this.updateJobInDatabase(job);
    }
  }

  private async simulateJobExecution(job: ImportJob): Promise<void> {
    // Simulate job progress
    for (let i = 0; i <= job.totalItems; i += Math.ceil(job.totalItems / 10)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const progress = Math.min((i / job.totalItems) * 100, 100);
      await this.updateJobProgress(
        job.id,
        progress,
        i,
        Math.floor(i * 0.95), // 95% success rate
        Math.floor(i * 0.05), // 5% error rate
        []
      );
    }

    await this.completeJob(job.id, true);
  }

  private async saveJobToDatabase(job: ImportJob): Promise<void> {
    try {
        const { error } = await (supabase as any)
          .from('import_jobs')
          .insert({
            id: job.id,
            user_id: job.userId,
            job_type: job.type,
            status: job.status,
            total_products: job.totalItems,
            import_settings: { 
              priority: job.priority,
              supplier_id: job.supplierId,
              scheduled_at: job.scheduledAt.toISOString(),
              ...job.metadata 
            },
          });

      if (error) {
        console.error('Failed to save job to database:', error);
      }
    } catch (error) {
      console.error('Database error:', error);
    }
  }

  private async updateJobInDatabase(job: ImportJob): Promise<void> {
    try {
      const { error } = await supabase
        .from('import_jobs')
        .update({
          status: job.status,
          processed_rows: job.processedItems,
          success_rows: job.successCount,
          error_rows: job.errorCount,
          errors: job.errors,
          result_data: { 
            progress: job.progress,
            started_at: job.startedAt?.toISOString(),
            completed_at: job.completedAt?.toISOString(),
          },
        })
        .eq('id', job.id);

      if (error) {
        console.error('Failed to update job in database:', error);
      }
    } catch (error) {
      console.error('Database error:', error);
    }
  }

  private removeJobFromQueue(jobId: string): void {
    for (const queue of this.queues.values()) {
      const index = queue.jobs.findIndex(job => job.id === jobId);
      if (index !== -1) {
        queue.jobs.splice(index, 1);
        break;
      }
    }
  }

  // Public API methods
  async getQueueStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};
    
    for (const [name, queue] of this.queues.entries()) {
      stats[name] = {
        total: queue.jobs.length,
        queued: queue.jobs.filter(j => j.status === 'queued').length,
        running: queue.jobs.filter(j => j.status === 'running').length,
        completed: queue.jobs.filter(j => j.status === 'completed').length,
        failed: queue.jobs.filter(j => j.status === 'failed').length,
        isActive: queue.isActive,
        concurrency: queue.concurrency,
      };
    }
    
    return stats;
  }

  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      queue.isActive = false;
    }
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      queue.isActive = true;
      this.startProcessing();
    }
  }
}