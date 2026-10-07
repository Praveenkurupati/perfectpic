# MongoDB Atlas Continuous Point-in-Time Recovery (PITR) & High Availability

## 1. Overview
The PerfectPic enterprise architecture integrates **MongoDB Atlas M10+ multi-AZ replica sets** combined with **Continuous Cloud Backups & Point-in-Time Recovery (PITR)**.

This guarantees:
* **Recovery Point Objective (RPO)**: Under 1 minute (continuous oplog streaming)
* **Recovery Time Objective (RTO)**: Under 15 minutes for complete cluster restoration
* **Retention Window**: 35 days of continuous point-in-time recovery + automated daily snapshots (retained for 30 days)

---

## 2. Cluster Connection String Configuration
In production environments, configure `MONGODB_URI` using the DNS SRV protocol:

```env
MONGODB_URI=mongodb+srv://perfectpic-app:<DB_PASSWORD>@perfectpic-prod.mongodb.net/perfectpic?retryWrites=true&w=majority&readPreference=primaryPreferred&maxPoolSize=50&minPoolSize=10
```

### Connection Flags & Sizing
| Parameter | Setting | Description |
| :--- | :--- | :--- |
| `retryWrites` | `true` | Automatically retries transient write errors during primary failovers |
| `w` | `majority` | Confirms writes across quorum of replica set nodes before acknowledgment |
| `readPreference` | `primaryPreferred` | Directs transactional writes and reads to primary, analytics to secondaries |
| `maxPoolSize` | `50` | Supports up to 50 concurrent persistent sockets per backend replica |
| `minPoolSize` | `10` | Maintains 10 warm connections to eliminate TLS handshake latency |
| `socketTimeoutMS` | `45000` | Guards against socket hangs while allowing long batch queries |
| `serverSelectionTimeoutMS` | `5000` | Rapid failover detection within 5 seconds |

---

## 3. Continuous Cloud Backup & PITR Specifications
MongoDB Atlas captures incremental oplog modifications continuously.

### Backup Schedule Matrix
| Backup Type | Frequency | Retention Window | Storage Tier |
| :--- | :--- | :--- | :--- |
| **Continuous Oplog (PITR)** | Real-time stream | **35 Days** | AWS S3 Encrypted Glacier/Standard |
| **Daily Snapshots** | Every 24 hours at 02:00 UTC | **30 Days** | AWS S3 Geo-replicated Snapshot |
| **Weekly Snapshots** | Every Sunday at 03:00 UTC | **12 Weeks** | AWS S3 Cold Archive |
| **Monthly Snapshots** | 1st of every month | **12 Months** | AWS S3 Archival Vault |

---

## 4. Point-in-Time Recovery Procedure

In the event of accidental data corruption, bad deployment, or disaster recovery:

1. **Log in to MongoDB Atlas Console**:
   Navigate to `Database Deployments` → `perfectpic-prod` → `Backup` tab.
2. **Select Restore Point**:
   Choose **Restore to Point in Time**. Specify exact UTC timestamp:
   `YYYY-MM-DD HH:MM:SS UTC`.
3. **Target Destination**:
   * *Option A (In-Place)*: Restore directly over `perfectpic-prod` (requires brief maintenance window).
   * *Option B (Side-by-Side)*: Restore to a temporary staging cluster `perfectpic-restore-drill` to inspect data before cutover.
4. **Automated Verification**:
   Once the restore completes, verify collections (`orders`, `products`, `users`, `projects`) and document integrity counts.
5. **Update DNS / App Configuration**:
   Update `MONGODB_URI` to point to the restored cluster if Side-by-Side restoration was performed.

---

## 5. Automated Local & Sidecar Fallback
In addition to Atlas PITR, the backend maintains automated daily compressed archives via:
* `npm run backup:node`
* `npm run backup:mongo` (`scripts/backup-mongodb.sh`)
* Archives stored at: `backups/mongodb/perfectpic-mongodb-backup-YYYY-MM-DD-HHmmss.tar.gz`
* Enforced with automated **30-day retention pruning**!
