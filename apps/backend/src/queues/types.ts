// apps/backend/src/queues/types.ts

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';

export interface JobOptions {
  attempts?: number;        // default: 3
  backoffMs?: number;       // default: 1000
  timeoutMs?: number;       // default: 60000
  priority?: number;        // lower number = higher priority
}

export interface Job<T = any> {
  id: string;
  queueName: string;
  name: string;
  data: T;
  status: JobStatus;
  progress: number;         // 0 to 100
  attempts: number;
  maxAttempts: number;
  failedReason?: string;
  returnValue?: any;
  createdAt: number;
  processedAt?: number;
  finishedAt?: number;
  updateProgress(percent: number): Promise<void>;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  total: number;
}

export type JobProcessor<T = any, R = any> = (job: Job<T>) => Promise<R>;

export interface WorkerOptions {
  concurrency?: number;
}
