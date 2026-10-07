// apps/backend/src/queues/QueueManager.ts
import { EventEmitter } from 'events';
import crypto from 'crypto';
import { Job, JobOptions, JobProcessor, JobStatus, QueueStats, WorkerOptions } from './types';
import redisClientModule, { isRedisConnected, getRedisClient } from '../cache/redis';
import { logger } from '../utils/logger';

export class ManagedJob<T = any> implements Job<T> {
  public id: string;
  public queueName: string;
  public name: string;
  public data: T;
  public status: JobStatus;
  public progress: number;
  public attempts: number;
  public maxAttempts: number;
  public failedReason?: string;
  public returnValue?: any;
  public createdAt: number;
  public processedAt?: number;
  public finishedAt?: number;

  constructor(queueName: string, name: string, data: T, opts?: JobOptions) {
    this.id = opts?.jobId || `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    this.queueName = queueName;
    this.name = name;
    this.data = data;
    this.status = 'waiting';
    this.progress = 0;
    this.attempts = 0;
    this.maxAttempts = opts?.attempts ?? 3;
    this.createdAt = Date.now();
  }

  public async updateProgress(percent: number): Promise<void> {
    this.progress = Math.min(100, Math.max(0, Math.round(percent)));
    if (isRedisConnected()) {
      const redis = getRedisClient();
      if (redis) {
        await redis.hset(`bullmq:${this.queueName}:jobs:${this.id}`, 'progress', this.progress).catch(() => {});
      }
    }
    QueueManager.emitProgress(this);
  }

  public toJSON() {
    return {
      id: this.id,
      queueName: this.queueName,
      name: this.name,
      data: this.data,
      status: this.status,
      progress: this.progress,
      attempts: this.attempts,
      maxAttempts: this.maxAttempts,
      failedReason: this.failedReason,
      returnValue: this.returnValue,
      createdAt: this.createdAt,
      processedAt: this.processedAt,
      finishedAt: this.finishedAt,
    };
  }

  public static fromJSON<T = any>(obj: any): ManagedJob<T> {
    const job = new ManagedJob<T>(obj.queueName, obj.name, obj.data);
    job.id = obj.id;
    job.status = obj.status || 'waiting';
    job.progress = obj.progress || 0;
    job.attempts = obj.attempts || 0;
    job.maxAttempts = obj.maxAttempts || 3;
    job.failedReason = obj.failedReason;
    job.returnValue = obj.returnValue;
    job.createdAt = obj.createdAt || Date.now();
    job.processedAt = obj.processedAt;
    job.finishedAt = obj.finishedAt;
    return job;
  }
}

export class Queue<T = any> extends EventEmitter {
  private inMemoryJobs: Map<string, ManagedJob<T>> = new Map();
  private inMemoryWaiting: string[] = [];
  private inMemoryActive: string[] = [];

  constructor(public readonly name: string) {
    super();
  }

  /**
   * Adds a job with durable Redis persistence and BullMQ queue mechanics
   */
  public async add(jobName: string, data: T, opts?: JobOptions): Promise<Job<T>> {
    const job = new ManagedJob<T>(this.name, jobName, data, opts);

    // 1. In-memory state tracking
    this.inMemoryJobs.set(job.id, job);
    this.inMemoryWaiting.push(job.id);

    // 2. Redis-backed BullMQ persistence
    if (isRedisConnected()) {
      const redis = getRedisClient();
      if (redis) {
        try {
          const serialized = JSON.stringify(job.toJSON());
          const pipeline = redis.pipeline();
          // Store job payload hash with 48h TTL
          pipeline.hset(`bullmq:${this.name}:jobs:${job.id}`, 'payload', serialized);
          pipeline.expire(`bullmq:${this.name}:jobs:${job.id}`, 172800);
          // Push job ID onto waiting queue list
          pipeline.rpush(`bullmq:${this.name}:waiting`, job.id);
          await pipeline.exec();
        } catch (err: any) {
          logger.warn(`[BullMQ:${this.name}] Redis add warning for ${job.id}:`, err?.message);
        }
      }
    }

    this.emit('waiting', job);
    QueueManager.notifyWorkers(this.name);
    return job;
  }

  public async getJob(id: string): Promise<Job<T> | null> {
    const inMem = this.inMemoryJobs.get(id);
    if (inMem) return inMem;

    if (isRedisConnected()) {
      const redis = getRedisClient();
      if (redis) {
        try {
          const raw = await redis.hget(`bullmq:${this.name}:jobs:${id}`, 'payload');
          if (raw) {
            const parsed = JSON.parse(raw);
            const restored = ManagedJob.fromJSON<T>(parsed);
            this.inMemoryJobs.set(id, restored);
            return restored;
          }
        } catch {}
      }
    }
    return null;
  }

  public async getJobs(statuses?: JobStatus[]): Promise<Job<T>[]> {
    const all = Array.from(this.inMemoryJobs.values());
    if (!statuses || statuses.length === 0) return all;
    return all.filter((j) => statuses.includes(j.status));
  }

  public async getStats(): Promise<QueueStats> {
    if (isRedisConnected()) {
      const redis = getRedisClient();
      if (redis) {
        try {
          const [waiting, active, completed, failed] = await Promise.all([
            redis.llen(`bullmq:${this.name}:waiting`),
            redis.llen(`bullmq:${this.name}:active`),
            redis.scard(`bullmq:${this.name}:completed`),
            redis.llen(`bullmq:${this.name}:failed`),
          ]);
          return {
            waiting,
            active,
            completed,
            failed,
            total: waiting + active + completed + failed,
          };
        } catch {}
      }
    }

    let waiting = 0;
    let active = 0;
    let completed = 0;
    let failed = 0;

    for (const j of this.inMemoryJobs.values()) {
      if (j.status === 'waiting') waiting++;
      else if (j.status === 'active') active++;
      else if (j.status === 'completed') completed++;
      else if (j.status === 'failed') failed++;
    }

    return {
      waiting,
      active,
      completed,
      failed,
      total: this.inMemoryJobs.size,
    };
  }

  /**
   * Internal claim: Atomically shifts job from waiting to active queue
   */
  public async _claimNextJob(): Promise<ManagedJob<T> | null> {
    if (isRedisConnected()) {
      const redis = getRedisClient();
      if (redis) {
        try {
          // Atomic BullMQ RPOPLPUSH transition: waiting -> active
          const claimedId = await redis.rpoplpush(
            `bullmq:${this.name}:waiting`,
            `bullmq:${this.name}:active`
          );
          if (claimedId) {
            const job = await this.getJob(claimedId);
            if (job) return job as ManagedJob<T>;
          }
        } catch (err: any) {
          logger.warn(`[BullMQ:${this.name}] Atomic claim fallback:`, err?.message);
        }
      }
    }

    // In-memory fallback
    while (this.inMemoryWaiting.length > 0) {
      const id = this.inMemoryWaiting.shift()!;
      const job = this.inMemoryJobs.get(id);
      if (job && job.status === 'waiting') {
        this.inMemoryActive.push(id);
        return job;
      }
    }
    return null;
  }

  /**
   * Acknowledges successful job completion (ACK)
   */
  public async _ackJob(job: ManagedJob<T>, result: any) {
    job.status = 'completed';
    job.progress = 100;
    job.returnValue = result;
    job.finishedAt = Date.now();

    // Remove from in-memory active list
    this.inMemoryActive = this.inMemoryActive.filter((id) => id !== job.id);

    if (isRedisConnected()) {
      const redis = getRedisClient();
      if (redis) {
        try {
          const pipeline = redis.pipeline();
          // Remove from active list
          pipeline.lrem(`bullmq:${this.name}:active`, 1, job.id);
          // Add to completed set
          pipeline.sadd(`bullmq:${this.name}:completed`, job.id);
          // Update persistent job hash
          pipeline.hset(`bullmq:${this.name}:jobs:${job.id}`, 'payload', JSON.stringify(job.toJSON()));
          pipeline.del(`bullmq:${this.name}:lock:${job.id}`);
          await pipeline.exec();
        } catch (err: any) {
          logger.warn(`[BullMQ:${this.name}] Ack warning:`, err?.message);
        }
      }
    }
  }

  /**
   * Rejects job or requeues with backoff (NACK)
   */
  public async _nackJob(job: ManagedJob<T>, error: any) {
    job.attempts++;
    job.failedReason = error?.message || String(error);

    // Remove from in-memory active list
    this.inMemoryActive = this.inMemoryActive.filter((id) => id !== job.id);

    if (job.attempts < job.maxAttempts) {
      // Exponential backoff retry
      const backoffMs = Math.min(1000 * Math.pow(2, job.attempts - 1), 10000);
      job.status = 'waiting';

      setTimeout(async () => {
        this.inMemoryWaiting.push(job.id);
        if (isRedisConnected()) {
          const redis = getRedisClient();
          if (redis) {
            try {
              const pipeline = redis.pipeline();
              pipeline.lrem(`bullmq:${this.name}:active`, 1, job.id);
              pipeline.rpush(`bullmq:${this.name}:waiting`, job.id);
              pipeline.hset(`bullmq:${this.name}:jobs:${job.id}`, 'payload', JSON.stringify(job.toJSON()));
              pipeline.del(`bullmq:${this.name}:lock:${job.id}`);
              await pipeline.exec();
            } catch {}
          }
        }
        QueueManager.notifyWorkers(this.name);
      }, backoffMs);
    } else {
      // Dead-letter queue
      job.status = 'failed';
      job.finishedAt = Date.now();

      if (isRedisConnected()) {
        const redis = getRedisClient();
        if (redis) {
          try {
            const pipeline = redis.pipeline();
            pipeline.lrem(`bullmq:${this.name}:active`, 1, job.id);
            pipeline.rpush(`bullmq:${this.name}:failed`, job.id);
            pipeline.hset(`bullmq:${this.name}:jobs:${job.id}`, 'payload', JSON.stringify(job.toJSON()));
            pipeline.del(`bullmq:${this.name}:lock:${job.id}`);
            await pipeline.exec();
          } catch {}
        }
      }
    }
  }
}

export class Worker<T = any, R = any> extends EventEmitter {
  private isRunning = false;
  private activeCount = 0;
  private concurrency: number;
  private workerId: string;

  constructor(
    public readonly queueName: string,
    private processor: JobProcessor<T, R>,
    opts?: WorkerOptions
  ) {
    super();
    this.concurrency = opts?.concurrency || 2;
    this.workerId = `worker_${process.pid}_${crypto.randomBytes(3).toString('hex')}`;
    QueueManager.registerWorker(this);
    this.start();
  }

  public start() {
    this.isRunning = true;
    this.checkNext();
  }

  public async stop() {
    this.isRunning = false;
  }

  public async checkNext() {
    if (!this.isRunning || this.activeCount >= this.concurrency) return;

    const queue = QueueManager.getQueue<T>(this.queueName);
    if (!queue) return;

    const job = await queue._claimNextJob();
    if (!job) return;

    this.activeCount++;
    job.status = 'active';
    job.processedAt = Date.now();

    // Durable Redis lease lock for 60 seconds
    if (isRedisConnected()) {
      const redis = getRedisClient();
      if (redis) {
        await redis.set(`bullmq:${this.queueName}:lock:${job.id}`, this.workerId, 'EX', 60, 'NX').catch(() => {});
      }
    }

    this.emit('active', job);

    // Process job asynchronously with durable acknowledgments
    (async () => {
      try {
        const result = await this.processor(job);
        // Durable Worker Acknowledgment (ACK)
        await queue._ackJob(job, result);
        this.emit('completed', job, result);
      } catch (err: any) {
        logger.error(`[Worker:${this.queueName}] Job ${job.id} failed (attempt ${job.attempts + 1}/${job.maxAttempts}):`, err?.message || err);
        // Durable Worker Negative Acknowledgment / Dead-Letter (NACK)
        await queue._nackJob(job, err);
        if (job.status === 'failed') {
          this.emit('failed', job, err);
        }
      } finally {
        this.activeCount--;
        this.checkNext();
      }
    })();

    // Check remaining concurrency slots
    if (this.activeCount < this.concurrency) {
      this.checkNext();
    }
  }
}

export class QueueManager {
  private static queues: Map<string, Queue<any>> = new Map();
  private static workers: Map<string, Worker<any>[]> = new Map();

  public static getOrCreateQueue<T = any>(name: string): Queue<T> {
    if (!this.queues.has(name)) {
      this.queues.set(name, new Queue<T>(name));
    }
    return this.queues.get(name)! as Queue<T>;
  }

  public static getQueue<T = any>(name: string): Queue<T> | undefined {
    return this.queues.get(name) as Queue<T> | undefined;
  }

  public static registerWorker(worker: Worker<any>) {
    const list = this.workers.get(worker.queueName) || [];
    list.push(worker);
    this.workers.set(worker.queueName, list);
  }

  public static notifyWorkers(queueName: string) {
    const workers = this.workers.get(queueName);
    if (workers) {
      for (const w of workers) {
        w.checkNext();
      }
    }
  }

  public static emitProgress(job: ManagedJob<any>) {
    const queue = this.queues.get(job.queueName);
    if (queue) {
      queue.emit('progress', job, job.progress);
    }
  }

  public static async getAllStats(): Promise<Record<string, QueueStats>> {
    const result: Record<string, QueueStats> = {};
    for (const [name, queue] of this.queues.entries()) {
      result[name] = await queue.getStats();
    }
    return result;
  }
}

// Pre-configured enterprise job queues
export const printRenderQueue = QueueManager.getOrCreateQueue<{
  orderId: string;
  projectId?: string;
  customerEmail?: string;
  options?: any;
}>('print-render-queue');

export const preflightQueue = QueueManager.getOrCreateQueue<{
  projectId: string;
  photoUrls: string[];
  dimensions?: string;
  pageCount?: number;
}>('preflight-queue');

export const notificationQueue = QueueManager.getOrCreateQueue<{
  type: 'order_confirmation' | 'otp' | 'shipping_update';
  recipient: string;
  payload: any;
}>('notification-queue');
