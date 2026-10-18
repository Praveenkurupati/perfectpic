// apps/backend/src/services/AnniversaryReminderScheduler.ts
import { AnniversaryReminderService } from './AnniversaryReminderService';
import { logger } from '../utils/logger';

export class AnniversaryReminderScheduler {
  private static intervalHandle: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Start automated background Anniversary & Milestone Reminder Scheduler
   * Executes periodically (default: every 24 hours) to sweep eligible photobook orders
   * across Stage 1 (60d before), Stage 2 (30d before with ANNIVERSARY15), and Stage 3 (14d before delivery urgency).
   */
  public static start(intervalHours: number = 24): void {
    if (this.isRunning) return;
    this.isRunning = true;

    const intervalMs = intervalHours * 60 * 60 * 1000;
    logger.info(
      `⏰ [AnniversaryReminderScheduler] Initializing automated milestone reminder worker (Interval: ${intervalHours}h, Multi-Stage: 60d, 30d, 14d)`
    );

    // Run initial sweep 35 seconds after server boot
    setTimeout(() => {
      this.runMilestoneSweep().catch((err) => {
        logger.error('[AnniversaryReminderScheduler] Startup milestone sweep failed:', err.message);
      });
    }, 35000);

    // Schedule periodic background sweep
    this.intervalHandle = setInterval(() => {
      this.runMilestoneSweep().catch((err) => {
        logger.error('[AnniversaryReminderScheduler] Scheduled milestone sweep failed:', err.message);
      });
    }, intervalMs);

    if (this.intervalHandle.unref) {
      this.intervalHandle.unref();
    }
  }

  /**
   * Run single milestone reminder sweep across all eligible upcoming anniversaries
   */
  public static async runMilestoneSweep(): Promise<void> {
    try {
      logger.info('🔄 [AnniversaryReminderScheduler] Executing scheduled anniversary reminder sweep...');
      const summary = await AnniversaryReminderService.processScheduledAnniversaries();
      logger.info(
        `✅ [AnniversaryReminderScheduler] Milestone sweep complete: ${summary.successful}/${summary.processed} reminders sent (S1: ${summary.stage1Count}, S2: ${summary.stage2Count}, S3: ${summary.stage3Count})`
      );
    } catch (err: any) {
      logger.error('❌ [AnniversaryReminderScheduler] Error running milestone sweep:', err.message);
    }
  }

  public static stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    this.isRunning = false;
  }
}

export default AnniversaryReminderScheduler;
