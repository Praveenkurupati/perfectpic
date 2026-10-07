// apps/backend/src/services/BackupService.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import zlib from 'zlib';
import { exec } from 'child_process';
import util from 'util';
import mongoose from 'mongoose';
import { isDbConnected } from '../db/connection';
import { Order } from '../db/models/Order';
import { Product } from '../db/models/Product';
import { User } from '../db/models/User';
import { Project } from '../db/models/Project';
import { PromoCode } from '../db/models/PromoCode';
import { PromoCodeUsage } from '../db/models/PromoCodeUsage';
import { BundleTier } from '../db/models/BundleTier';
import { PageOption } from '../db/models/PageOption';
import { Address } from '../db/models/Address';
import { AnalyticsEvent } from '../db/models/AnalyticsEvent';
import { Otp } from '../db/models/Otp';
import { templates } from '../data/templates';
import { defaultBundleTiers } from '../data/bundles';
import { logger } from '../utils/logger';

const execAsync = util.promisify(exec);

export interface BackupMetadata {
  backupId: string;
  filename: string;
  createdAt: string;
  formattedDate: string;
  sizeBytes: number;
  sizeMb: number;
  sha256: string;
  collections: string[];
  documentCounts: Record<string, number>;
  retentionDays: number;
  expiresAt: string;
  daysRemaining?: number;
  isExpired?: boolean;
  status: 'completed' | 'failed';
}

export class BackupService {
  private static readonly RETENTION_DAYS = 30;

  /**
   * Determine the root backups directory
   */
  public static getBackupDir(): string {
    // Search upwards from backend directory for whitebook/backups/mongodb
    const candidates = [
      path.resolve(process.cwd(), 'backups/mongodb'),
      path.resolve(process.cwd(), '../../backups/mongodb'),
      path.resolve(__dirname, '../../../../../backups/mongodb'),
    ];

    for (const dir of candidates) {
      if (fs.existsSync(dir)) return dir;
    }

    // Default to project root or current working dir
    const defaultDir = path.resolve(process.cwd(), 'backups/mongodb');
    if (!fs.existsSync(defaultDir)) {
      fs.mkdirSync(defaultDir, { recursive: true });
    }
    return defaultDir;
  }

  /**
   * Generate standard timestamp string: YYYY-MM-DD-HHmmss
   */
  public static generateTimestamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const mins = pad(d.getMinutes());
    const secs = pad(d.getSeconds());
    return `${year}-${month}-${day}-${hours}${mins}${secs}`;
  }

  /**
   * Create an automated backup and prune archives older than 30 days
   */
  public static async createBackup(customRetentionDays?: number): Promise<BackupMetadata> {
    const backupDir = this.getBackupDir();
    const timestamp = this.generateTimestamp();
    const retentionDays = customRetentionDays || this.RETENTION_DAYS;
    const backupId = `perfectpic-mongodb-backup-${timestamp}`;
    const archiveFilename = `${backupId}.tar.gz`;
    const metaFilename = `${backupId}.meta.json`;
    const archivePath = path.join(backupDir, archiveFilename);
    const metaPath = path.join(backupDir, metaFilename);

    logger.info(`📦 [BackupService] Starting MongoDB backup: ${archiveFilename}`);

    const documentCounts: Record<string, number> = {};
    const collectionData: Record<string, any[]> = {};

    // 1. Gather all collections
    const models: Array<{ name: string; model: mongoose.Model<any> }> = [
      { name: 'orders', model: Order },
      { name: 'products', model: Product },
      { name: 'users', model: User },
      { name: 'projects', model: Project },
      { name: 'promocodes', model: PromoCode },
      { name: 'promocode_usages', model: PromoCodeUsage },
      { name: 'bundletiers', model: BundleTier },
      { name: 'pageoptions', model: PageOption },
      { name: 'addresses', model: Address },
      { name: 'analytics', model: AnalyticsEvent },
      { name: 'otps', model: Otp },
    ];

    if (isDbConnected()) {
      for (const { name, model } of models) {
        try {
          const docs = await model.find({}).lean();
          collectionData[name] = docs;
          documentCounts[name] = docs.length;
        } catch (err: any) {
          logger.warn(`Could not dump collection '${name}':`, err.message);
          collectionData[name] = [];
          documentCounts[name] = 0;
        }
      }
    } else {
      // Offline fallback: dump default products and bundle tiers
      collectionData['products'] = templates;
      documentCounts['products'] = templates.length;
      collectionData['bundletiers'] = defaultBundleTiers;
      documentCounts['bundletiers'] = defaultBundleTiers.length;
      collectionData['orders'] = [];
      documentCounts['orders'] = 0;
    }

    // 2. Compress data into .tar.gz archive
    const serializedPayload = JSON.stringify(
      {
        backupId,
        createdAt: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: isDbConnected() ? mongoose.connection.name : 'in-memory-fallback',
        counts: documentCounts,
        data: collectionData,
      },
      null,
      2
    );

    const gzipBuffer = zlib.gzipSync(Buffer.from(serializedPayload, 'utf-8'));
    fs.writeFileSync(archivePath, gzipBuffer);

    // 3. Compute SHA-256 and file size
    const sizeBytes = fs.statSync(archivePath).size;
    const sizeMb = Math.round((sizeBytes / (1024 * 1024)) * 100) / 100;
    const sha256 = crypto.createHash('sha256').update(gzipBuffer).digest('hex');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1000).toISOString();

    const metadata: BackupMetadata = {
      backupId,
      filename: archiveFilename,
      createdAt: now.toISOString(),
      formattedDate: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      sizeBytes,
      sizeMb,
      sha256,
      collections: Object.keys(collectionData),
      documentCounts,
      retentionDays,
      expiresAt,
      daysRemaining: retentionDays,
      isExpired: false,
      status: 'completed',
    };

    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
    logger.info(`✅ [BackupService] Successfully created backup ${archiveFilename} (${sizeMb} MB)`);

    // 4. Automatically prune backups older than 30 days
    await this.pruneOldBackups(retentionDays);

    return metadata;
  }

  /**
   * Enforce strict 30-day retention policy: automatically delete older backups
   */
  public static async pruneOldBackups(retentionDays: number = 30): Promise<{
    prunedCount: number;
    prunedFiles: string[];
  }> {
    const backupDir = this.getBackupDir();
    const prunedFiles: string[] = [];
    const now = Date.now();
    const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;

    if (!fs.existsSync(backupDir)) {
      return { prunedCount: 0, prunedFiles: [] };
    }

    const files = fs.readdirSync(backupDir);

    for (const file of files) {
      if (!file.startsWith('perfectpic-mongodb-backup-')) continue;

      const filePath = path.join(backupDir, file);
      try {
        const stats = fs.statSync(filePath);
        const ageMs = now - stats.mtimeMs;

        // Check companion .meta.json if available
        let isExpired = ageMs > maxAgeMs;
        if (file.endsWith('.meta.json')) {
          try {
            const metaContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            if (metaContent.expiresAt && new Date(metaContent.expiresAt).getTime() <= now) {
              isExpired = true;
            }
          } catch {}
        }

        if (isExpired) {
          fs.unlinkSync(filePath);
          prunedFiles.push(file);
          logger.info(`🧹 [Backup Retention] Automatically pruned expired backup file: ${file}`);
        }
      } catch (err: any) {
        logger.warn(`Could not check or prune ${file}:`, err.message);
      }
    }

    return {
      prunedCount: prunedFiles.length,
      prunedFiles,
    };
  }

  /**
   * List all stored backups with retention and expiry metrics
   */
  public static listBackups(): BackupMetadata[] {
    const backupDir = this.getBackupDir();
    if (!fs.existsSync(backupDir)) return [];

    const files = fs.readdirSync(backupDir);
    const manifests: BackupMetadata[] = [];
    const now = Date.now();

    for (const file of files) {
      if (file.endsWith('.meta.json')) {
        try {
          const raw = fs.readFileSync(path.join(backupDir, file), 'utf-8');
          const meta: BackupMetadata = JSON.parse(raw);
          const expiresAtMs = new Date(meta.expiresAt).getTime();
          const msRemaining = expiresAtMs - now;
          meta.daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
          meta.isExpired = msRemaining <= 0;
          manifests.push(meta);
        } catch {}
      }
    }

    // Sort newest first
    manifests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return manifests;
  }
}
