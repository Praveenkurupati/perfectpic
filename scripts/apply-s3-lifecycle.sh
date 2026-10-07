#!/usr/bin/env bash
# ==============================================================================
# PerfectPic Enterprise AWS S3 30-Day Photo Lifecycle Retention Rule Enforcer
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
POLICY_FILE="${SCRIPT_DIR}/aws-s3-lifecycle-policy.json"

if [ -f "${ROOT_DIR}/.env" ]; then
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
elif [ -f "${ROOT_DIR}/apps/backend/.env" ]; then
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/apps/backend/.env"
fi

BUCKET_NAME="${S3_BUCKET:-${AWS_S3_BUCKET:-}}"

if [ -z "${BUCKET_NAME}" ]; then
  echo "❌ Error: S3_BUCKET environment variable is not set."
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "⚠️ Warning: aws CLI not found. Falling back to Node.js S3 lifecycle engine..."
  cd "${ROOT_DIR}"
  ./apps/backend/node_modules/.bin/tsx -e "
    import { ensureS3LifecycleConfiguration } from './apps/backend/src/lib/s3';
    ensureS3LifecycleConfiguration().then(res => {
      console.log('Result:', res ? 'Successfully applied' : 'Not configured');
      process.exit(0);
    });
  "
  exit 0
fi

echo "🛡️ Applying 30-day lifecycle retention policy to bucket: ${BUCKET_NAME}..."
aws s3api put-bucket-lifecycle-configuration \
  --bucket "${BUCKET_NAME}" \
  --lifecycle-configuration "file://${POLICY_FILE}"

echo "✅ Successfully applied 30-day photo lifecycle retention rule to s3://${BUCKET_NAME}"
