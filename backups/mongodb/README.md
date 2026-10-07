# PerfectPic Automated MongoDB Backup & Disaster Recovery

This directory contains automated database backup archives and metadata manifests for the PerfectPic photobook platform.

## Policy & Retention Architecture

- **Format & Naming**:
  - Archive: `perfectpic-mongodb-backup-YYYY-MM-DD-HHmmss.tar.gz`
  - Manifest: `perfectpic-mongodb-backup-YYYY-MM-DD-HHmmss.meta.json`
- **Retention Period**:
  - Strict **30-day retention policy**.
  - Backups older than 30 days are automatically detected, verified, and safely removed on each backup run and daily cron execution.
- **Integrity**:
  - Each backup archive is cryptographically verified with a SHA-256 hash stored in its companion `.meta.json` manifest.
- **Collections Included**:
  - Orders, Products, Users, Projects, PromoCodes, PromoCodeUsages, BundleTiers, PageOptions, Customer Addresses, Support Tickets, Analytics Events, and OTP records.

## Usage & Commands

### 1. Manual Backup via Shell Script
```bash
bash scripts/backup-mongodb.sh
```

### 2. Manual Backup via npm
```bash
npm run backup:mongo
```

### 3. Restore Database from Backup
```bash
# Restore latest backup automatically
bash scripts/restore-mongodb.sh

# Or restore a specific backup archive
bash scripts/restore-mongodb.sh backups/mongodb/perfectpic-mongodb-backup-2026-10-07-200500.tar.gz
```

### 4. Admin API Endpoints
- `GET /api/v1/admin/backups` — List all stored backups with age, size, and expiry date.
- `POST /api/v1/admin/backups/create` — Trigger immediate full backup and prune older than 30 days.
- `POST /api/v1/admin/backups/prune` — Run 30-day retention pruning job.
