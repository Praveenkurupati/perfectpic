// apps/backend/src/scripts/run-backup.ts
import { BackupService } from '../services/BackupService';
import { connectDB } from '../db/connection';
import { logger } from '../utils/logger';

async function main() {
  try {
    logger.info('🚀 Executing standalone MongoDB backup task...');
    await connectDB().catch(() => {});
    const metadata = await BackupService.createBackup(30);
    console.log(JSON.stringify(metadata, null, 2));
    process.exit(0);
  } catch (err: any) {
    logger.error('❌ Standalone backup failed:', err);
    process.exit(1);
  }
}

main();
