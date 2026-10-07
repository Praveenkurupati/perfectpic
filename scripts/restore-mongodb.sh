#!/usr/bin/env bash
# ==============================================================================
# PerfectPic Enterprise MongoDB Disaster Recovery & Restore Script
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_DIR="${ROOT_DIR}/backups/mongodb"

# 1. Load environment variables
if [ -f "${ROOT_DIR}/.env" ]; then
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
elif [ -f "${ROOT_DIR}/apps/backend/.env" ]; then
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/apps/backend/.env"
fi

MONGO_URI="${MONGODB_URI:-${MONGO_URI:-mongodb://localhost:27017/perfectpic}}"

# 2. Determine target archive
TARGET_ARCHIVE="${1:-}"

if [ -z "${TARGET_ARCHIVE}" ]; then
  echo "🔍 No archive specified. Finding latest backup in ${BACKUP_DIR}..."
  TARGET_ARCHIVE=$(find "${BACKUP_DIR}" -type f -name "perfectpic-mongodb-backup-*.tar.gz" | sort | tail -n 1)
fi

if [ -z "${TARGET_ARCHIVE}" ] || [ ! -f "${TARGET_ARCHIVE}" ]; then
  echo "❌ Error: No valid backup archive found at '${TARGET_ARCHIVE:-none}'."
  echo "Usage: $0 [path/to/perfectpic-mongodb-backup-YYYY-MM-DD-HHmmss.tar.gz]"
  exit 1
fi

echo "======================================================================"
echo "♻️ [Disaster Recovery] Restoring MongoDB from: ${TARGET_ARCHIVE}"
echo "   Target URI: ${MONGO_URI}"
echo "======================================================================"

# 3. Check for companion metadata manifest
META_FILE="${TARGET_ARCHIVE%.tar.gz}.meta.json"
if [ -f "${META_FILE}" ]; then
  echo "📋 Metadata Manifest found: $(basename "${META_FILE}")"
  cat "${META_FILE}"
  echo ""
fi

# 4. Extract and restore
TEMP_RESTORE_DIR="${BACKUP_DIR}/tmp_restore_$(date +%s)"
mkdir -p "${TEMP_RESTORE_DIR}"

echo "📦 Decompressing archive..."
tar -xzf "${TARGET_ARCHIVE}" -C "${TEMP_RESTORE_DIR}"

if command -v mongorestore >/dev/null 2>&1; then
  echo "🚀 Running mongorestore with --drop (atomic replacement)..."
  mongorestore --uri="${MONGO_URI}" "${TEMP_RESTORE_DIR}" --drop --gzip
else
  echo "ℹ️ mongorestore binary not found. Delegating to Node.js Disaster Recovery Engine..."
  cd "${ROOT_DIR}"
  npm --prefix apps/backend run restore:node -- "${TEMP_RESTORE_DIR}"
fi

rm -rf "${TEMP_RESTORE_DIR}"

echo "======================================================================"
echo "🎉 MongoDB restore completed successfully!"
echo "======================================================================"
