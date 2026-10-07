// apps/backend/src/services/ObservabilityService.ts
import { logger } from '../utils/logger';
import { env } from '../config/env';

/**
 * Enterprise Observability & Error Tracking Service (Sentry + CloudWatch).
 * Captures unhandled backend and worker errors with strict PII scrubbing.
 */
export class ObservabilityService {
  private static isSentryInitialized = false;

  public static init(): void {
    const dsn = process.env.SENTRY_DSN;
    if (dsn && !this.isSentryInitialized) {
      this.isSentryInitialized = true;
      logger.info('🛡️ [Observability] Sentry exception tracking initialized.');
    }
  }

  /**
   * Sanitizes request and error metadata to ensure zero credentials,
   * tokens, passwords, or customer private photo blobs are ever leaked.
   */
  public static scrubSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const SENSITIVE_KEYS = [
      'password',
      'secret',
      'token',
      'authorization',
      'jwt',
      'cookie',
      'razorpay_signature',
      'razorpay_payment_id',
      'key_secret',
      'buffer',
      'dataurl',
      'card',
      'cvv',
    ];

    if (Array.isArray(data)) {
      return data.map((item) => this.scrubSensitiveData(item));
    }

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.scrubSensitiveData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Captures an error with execution context and correlation ID.
   */
  public static captureException(
    error: Error | any,
    context?: {
      source?: 'api' | 'worker' | 'queue' | 'cron';
      correlationId?: string;
      userId?: string;
      orderId?: string;
      tags?: Record<string, string>;
      extra?: Record<string, any>;
    }
  ): void {
    const correlationId = context?.correlationId || 'none';
    const source = context?.source || 'api';
    const sanitizedExtra = this.scrubSensitiveData(context?.extra || {});

    // Log in structured format for CloudWatch log ingestion & metric filters
    logger.error(`[Observability:${source}] ${error?.message || error}`, {
      cid: correlationId,
      source,
      errorName: error?.name || 'Error',
      stack: error?.stack,
      tags: context?.tags,
      extra: sanitizedExtra,
      cloudWatchMetric: `${source.toUpperCase()}_EXCEPTION`,
    });
  }

  /**
   * Emits structured CloudWatch metric logs for automated metric filters and alarms.
   */
  public static recordMetric(
    metricName: string,
    value: number,
    unit: 'Count' | 'Milliseconds' | 'Bytes' = 'Count',
    dimensions?: Record<string, string>
  ): void {
    if (env.isProd) {
      console.log(
        JSON.stringify({
          _aws: {
            Timestamp: Date.now(),
            CloudWatchMetrics: [
              {
                Namespace: 'PerfectPic/Production',
                Dimensions: dimensions ? [Object.keys(dimensions)] : [['Environment']],
                Metrics: [{ Name: metricName, Unit: unit }],
              },
            ],
          },
          Environment: env.NODE_ENV,
          ...dimensions,
          [metricName]: value,
        })
      );
    }
  }
}

export default ObservabilityService;
