// apps/backend/src/queues/QueueManager.ts
import { EventEmitter } from 'events';
import { Job, JobOptions, JobProcessor, JobStatus, QueueStats, WorkerOptions } from './types';
import redisClientModule, { isRedisConnected } from '../cache/redis';
import { logger } from '../utils/logger';

class ManagedJob<T = any> implements Job<T> {
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
    this.id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
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
    this.progress = Math.min(100, Math.max(0, percent));
    QueueManager.emitProgress(this);
  }
}

export class Queue<T = any> extends EventEmitter {
  private inMemoryJobs: Map<string, ManagedJob<T>> = new Map();
  private waitingIds: string[] = [];

  constructor(public readonly name: string) {
    super();
  }

  public async add(jobName: string, data: T, opts?: JobOptions): Promise<Job<T>> {
    const job = new ManagedJob<T>(this.name, jobName, data, opts);
    this.inMemoryJobs.set(job.id, job);
    this.waitingIds.push(job.id);

    // Distributed Redis persistence when connected
    if (isRedisConnected()) {
      try {
        await redisClientModule.set(`queue:${this.name}:job:${job.id}`, {
          id: job.id,
          name: job.name,
          data: job.data,
          status: job.status,
          createdAt: job.createdAt,
          maxAttempts: job.maxAttempts,
        }, 86400); // 24-hour TTL
      } catch (err: any) {
        logger.warn(`Redis queue add warning for ${job.id}:`, err?.message);
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
      try {
        const cached = await redisClientModule.get<any>(`queue:${this.name}:job:${id}`);
        if (cached) return cached as Job<T>;
      } catch {}
    }
    return null;
  }

  public async getJobs(statuses?: JobStatus[]): Promise<Job<T>[]> {
    const all = Array.from(this.inMemoryJobs.values());
    if (!statuses || statuses.length === 0) return all;
    return all.filter((j) => statuses.includes(j.status));
  }

  public async getStats(): Promise<QueueStats> {
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

  public _popWaiting(): ManagedJob<T> | null {
    while (this.waitingIds.length > 0) {
      const id = this.waitingIds.shift()!;
      const job = this.inMemoryJobs.get(id);
      if (job && job.status === 'waiting') {
        return job;
      }
    }
    return null;
  }

  public _requeue(job: ManagedJob<T>) {
    job.status = 'waiting';
    this.waitingIds.push(job.id);
    QueueManager.notifyWorkers(this.name);
  }
}

export class Worker<T = any, R = any> extends EventEmitter {
  private isRunning = false;
  private activeCount = 0;
  private concurrency: number;

  constructor(
    public readonly queueName: string,
    private processor: JobProcessor<T, R>,
    opts?: WorkerOptions
  ) {
    super();
    this.concurrency = opts?.concurrency || 2;
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

    const job = queue._popWaiting();
    if (!job) return;

    this.activeCount++;
    job.status = 'active';
    job.processedAt = Date.now();
    job.attempts++;

    this.emit('active', job);

    // Process job asynchronously
    (async () => {
      try {
        const result = await this.processor(job);
        job.status = 'completed';
        job.progress = 100;
        job.returnValue = result;
        job.finishedAt = Date.now();
        this.emit('completed', job, result);

        if (isRedisConnected()) {
          try {
            await redisClientModule.set(`queue:${this.queueName}:job:${job.id}`, {
              ...job,
              status: 'completed',
              finishedAt: job.finishedAt,
            }, 86400);
          } catch {}
        }
      } catch (err: any) {
        logger.error(`[Worker ${this.queueName}] Job ${job.id} failed (attempt ${job.attempts}/${job.maxAttempts}):`, err?.message || err);
        job.failedReason = err?.message || String(err);

        if (job.attempts < job.maxAttempts) {
          // Exponential backoff retry
          const backoff = Math.min(1000 * Math.pow(2, job.attempts - 1), 10000);
          setTimeout(() => {
            queue._requeue(job);
          }, backoff);
        } else {
          job.status = 'failed';
          job.finishedAt = Date.now();
          this.emit('failed', job, err);

          if (isRedisConnected()) {
            try {
              await redisClientModule.set(`queue:${this.queueName}:job:${job.id}`, {
                ...job,
                status: 'failed',
                finishedAt: job.finishedAt,
              }, 86400);
            } catch {}
          }
        }
      } finally {
        this.activeCount--;
        this.checkNext();
      }
    })();

    // Fill remaining concurrency slots
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
