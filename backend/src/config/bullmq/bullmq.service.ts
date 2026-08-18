import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } from 'config';
import { QUEUE_NAMES } from './constants';

interface RedisConnection {
  host: string;
  port: number;
  password?: string;
  maxRetriesPerRequest?: number | null;
  retryDelayOnFailover?: number;
}

class BullMQService {
  private static instance: BullMQService;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private redisConnection: RedisConnection;

  private constructor() {
    this.redisConnection = {
      host: REDIS_HOST as string,
      port: Number(REDIS_PORT),
      password: REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      retryDelayOnFailover: 100
    };
  }

  static getInstance(): BullMQService {
    if (!BullMQService.instance) {
      BullMQService.instance = new BullMQService();
    }
    return BullMQService.instance;
  }

  async initialize(): Promise<void> {
    try {
      console.log('🚀 [BullMQ] Initializing BullMQ service...');
      
      // Initialize all queues
      await this.setupQueues();
      
      // Initialize queue events listeners
      await this.setupQueueEvents();
      
      console.log('✅ [BullMQ] BullMQ service initialized successfully');
    } catch (error) {
      console.error('❌ [BullMQ] Failed to initialize BullMQ service:', error);
      throw error;
    }
  }

  private async setupQueues(): Promise<void> {
    const queueNames = Object.values(QUEUE_NAMES);
    
    for (const queueName of queueNames) {
      try {
        const queue = new Queue(queueName, {
          connection: this.redisConnection,
          defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: true,
            attempts: 10,
            backoff: {
              type: 'exponential',
              delay: 2000
            }
          }
        });

        this.queues.set(queueName, queue);
        console.log(`✅ [BullMQ] Queue '${queueName}' created successfully`);
      } catch (error) {
        console.error(`❌ [BullMQ] Failed to create queue '${queueName}':`, error);
        throw error;
      }
    }
  }


  private async setupQueueEvents(): Promise<void> {
    const queueNames = Object.values(QUEUE_NAMES);
    
    for (const queueName of queueNames) {
      try {
        const queueEvents = new QueueEvents(queueName, {
          connection: this.redisConnection
        });

        queueEvents.on('completed', ({ jobId, returnvalue }) => {
          console.log(`✅ [BullMQ] Job ${jobId} in queue '${queueName}' completed:`, returnvalue);
        });

        queueEvents.on('failed', ({ jobId, failedReason }) => {
          console.error(`❌ [BullMQ] Job ${jobId} in queue '${queueName}' failed:`, failedReason);
        });

        queueEvents.on('progress', ({ jobId, data }) => {
          console.log(`📊 [BullMQ] Job ${jobId} in queue '${queueName}' progress:`, data);
        });

        this.queueEvents.set(queueName, queueEvents);
        console.log(`✅ [BullMQ] Queue events listener for '${queueName}' created successfully`);
      } catch (error) {
        console.error(`❌ [BullMQ] Failed to create queue events listener for '${queueName}':`, error);
        throw error;
      }
    }
  }

  getQueue(queueName: string): Queue | undefined {
    return this.queues.get(queueName);
  }

  async addJob(
    queueName: string,
    jobName: string,
    data: any,
    options?: {
      delay?: number;
      priority?: number;
      attempts?: number;
      backoff?: any;
      repeat?: any;
    }
  ): Promise<Job<any, any, string> | undefined> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        console.error(`❌ [BullMQ] Queue '${queueName}' not found`);
        return undefined;
      }

      const job = await queue.add(jobName, data, {
        delay: options?.delay || 0,
        priority: options?.priority || 5,
        attempts: options?.attempts || 3,
        backoff: options?.backoff || {
          type: 'exponential',
          delay: 2000
        },
        repeat: options?.repeat
      });

      console.log(`📋 [BullMQ] Job '${jobName}' added to queue '${queueName}' with ID: ${job.id}`);
      return job;
    } catch (error) {
      console.error(`❌ [BullMQ] Failed to add job '${jobName}' to queue '${queueName}':`, error);
      return undefined;
    }
  }

  async addRecurringJob(
    queueName: string,
    jobName: string,
    data: any,
    cronExpression: string,
    options?: {
      timezone?: string;
      endDate?: Date;
      every?: number;
    }
  ): Promise<Job<any, any, string> | undefined> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        console.error(`❌ [BullMQ] Queue '${queueName}' not found`);
        return undefined;
      }

      const job = await queue.add(jobName, data, {
        repeat: {
          pattern: cronExpression,
          endDate: options?.endDate,
          every: options?.every
        },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });

      console.log(`🔄 [BullMQ] Recurring job '${jobName}' added to queue '${queueName}' with ID: ${job.id}`);
      return job;
    } catch (error) {
      console.error(`❌ [BullMQ] Failed to add recurring job '${jobName}' to queue '${queueName}':`, error);
      return undefined;
    }
  }

  async processJobs(
    queueName: string,
    processor: (job: Job<any, any, string>) => Promise<void>,
    options?: {
      concurrency?: number;
      limiter?: any;
    }
  ): Promise<void> {
    try {
      if (this.workers.has(queueName)) {
        console.warn(`⚠️ [BullMQ] Worker for queue '${queueName}' already exists`);
        return;
      }

      const worker = new Worker(
        queueName,
        processor,
        {
          connection: this.redisConnection,
          concurrency: options?.concurrency || 1,
          limiter: options?.limiter
        }
      );

      worker.on('completed', (job) => {
        console.log(`✅ [BullMQ] Job ${job.id} completed in queue '${queueName}'`);
      });

      worker.on('failed', (job, err) => {
        console.error(`❌ [BullMQ] Job ${job?.id} failed in queue '${queueName}':`, err);
      });

      worker.on('error', (err) => {
        console.error(`❌ [BullMQ] Worker error in queue '${queueName}':`, err);
      });

      this.workers.set(queueName, worker);
      console.log(`👷 [BullMQ] Worker started for queue '${queueName}'`);
    } catch (error) {
      console.error(`❌ [BullMQ] Failed to start worker for queue '${queueName}':`, error);
      throw error;
    }
  }

  async getJobCounts(queueName: string): Promise<any> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        console.error(`❌ [BullMQ] Queue '${queueName}' not found`);
        return null;
      }

      const counts = await queue.getJobCounts();
      return counts;
    } catch (error) {
      console.error(`❌ [BullMQ] Failed to get job counts for queue '${queueName}':`, error);
      return null;
    }
  }

  async pauseQueue(queueName: string): Promise<void> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        console.error(`❌ [BullMQ] Queue '${queueName}' not found`);
        return;
      }

      await queue.pause();
      console.log(`⏸️ [BullMQ] Queue '${queueName}' paused`);
    } catch (error) {
      console.error(`❌ [BullMQ] Failed to pause queue '${queueName}':`, error);
    }
  }

  async resumeQueue(queueName: string): Promise<void> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        console.error(`❌ [BullMQ] Queue '${queueName}' not found`);
        return;
      }

      await queue.resume();
      console.log(`▶️ [BullMQ] Queue '${queueName}' resumed`);
    } catch (error) {
      console.error(`❌ [BullMQ] Failed to resume queue '${queueName}':`, error);
    }
  }

  async close(): Promise<void> {
    try {
      console.log('🔄 [BullMQ] Closing BullMQ service...');

      // Close all workers
      for (const [queueName, worker] of this.workers) {
        await worker.close();
        console.log(`✅ [BullMQ] Worker for queue '${queueName}' closed`);
      }

      // Close all queue events
      for (const [queueName, events] of this.queueEvents) {
        await events.close();
        console.log(`✅ [BullMQ] Queue events for '${queueName}' closed`);
      }

      // Close all queues
      for (const [queueName, queue] of this.queues) {
        await queue.close();
        console.log(`✅ [BullMQ] Queue '${queueName}' closed`);
      }

      console.log('✅ [BullMQ] BullMQ service closed successfully');
    } catch (error) {
      console.error('❌ [BullMQ] Error closing BullMQ service:', error);
      throw error;
    }
  }
}

export const bullMQService = BullMQService.getInstance();
