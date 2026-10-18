// apps/backend/src/services/ProjectReminderScheduler.ts
import { ProjectReminderService } from './ProjectReminderService';
import { logger } from '../utils/logger';

export class ProjectReminderScheduler {
  private static intervalHandle: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Start automated background abandoned draft recovery scheduler
   * Executes periodically (default: every 30 minutes) to sweep eligible projects
   * across Stage 1 (1-3h), Stage 2 (24h), and Stage 3 (72h with FINISH10 promo).
   */
  public static start(intervalMinutes: number = 30): void {
    if (this.isRunning) return;
    this.isRunning = true;

    const intervalMs = intervalMinutes * 60 * 1000;
    logger.info(
      `⏰ [ProjectReminderScheduler] Initializing automated CRM recovery worker (Interval: ${intervalMinutes}m, Multi-Stage: 1-3h, 24h, 72h)`
    );

    // Run initial sweep 25 seconds after server boot
    setTimeout(() => {
      this.runRecoverySweep().catch((err) => {
        logger.error('[ProjectReminderScheduler] Startup recovery sweep failed:', err.message);
      });
    }, 25000);

    // Schedule periodic background sweep
    this.intervalHandle = setInterval(() => {
      this.runRecoverySweep().catch((err) => {
        logger.error('[ProjectReminderScheduler] Scheduled recovery sweep failed:', err.message);
      });
    }, intervalMs);

    if (this.intervalHandle.unref) {
      this.intervalHandle.unref();
    }
  }

  /**
   * Run single recovery drip sweep across all active drafts
   */
  public static async runRecoverySweep(): Promise<void> {
    try {
      logger.info('🔄 [ProjectReminderScheduler] Executing scheduled abandoned draft recovery sweep...');
      const summary = await ProjectReminderService.processPendingReminders();
      logger.info(
        `✅ [ProjectReminderScheduler] Sweep complete: ${summary.successful}/${summary.processed} recovered reminders sent (S1: ${summary.stage1Count}, S2: ${summary.stage2Count}, S3: ${summary.stage3Count})`
      );
    } catch (err: any) {
      logger.error('❌ [ProjectReminderScheduler] Error running recovery sweep:', err.message);
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

export default ProjectReminderScheduler;
