// apps/backend/src/services/BackupScheduler.ts
import { BackupService } from './BackupService';
import { logger } from '../utils/logger';

export class BackupScheduler {
  private static intervalHandle: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Start automated background backup scheduler
   * Executes daily (every 24 hours) and cleans up backups older than 30 days
   */
  public static start(intervalHours: number = 24): void {
    if (this.isRunning) return;
    this.isRunning = true;

    const intervalMs = intervalHours * 60 * 60 * 1000;
    logger.info(`⏰ [BackupScheduler] Initializing automated daily MongoDB backup job (Interval: ${intervalHours}h, Retention: 30 days)`);

    // Run initial backup check asynchronously on startup
    setTimeout(() => {
      this.runDailyBackupJob().catch((err) => {
        logger.error('[BackupScheduler] Startup backup failed:', err.message);
      });
    }, 15000); // 15 seconds after server boot

    // Schedule ongoing daily timer
    this.intervalHandle = setInterval(() => {
      this.runDailyBackupJob().catch((err) => {
        logger.error('[BackupScheduler] Scheduled daily backup failed:', err.message);
      });
    }, intervalMs);

    if (this.intervalHandle.unref) {
      this.intervalHandle.unref();
    }
  }

  /**
   * Run single backup cycle with 30-day pruning
   */
  public static async runDailyBackupJob(): Promise<void> {
    try {
      logger.info('🔄 [BackupScheduler] Triggering scheduled MongoDB backup and 30-day retention pruning...');
      const metadata = await BackupService.createBackup(30);
      logger.info(
        `✅ [BackupScheduler] Daily backup completed: ${metadata.filename} (${metadata.sizeMb} MB). Expiry: ${metadata.expiresAt}`
      );
    } catch (err: any) {
      logger.error('❌ [BackupScheduler] Error running daily backup:', err.message);
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
