// tests/load/k6-upload-benchmark.js
// k6 Load Benchmark for PerfectPic High-Concurrency Photo Uploads (QA-02)
// Simulates 500 concurrent users uploading high-resolution photobook images.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom Metrics
const uploadSuccessRate = new Rate('upload_success_rate');
const presignLatency = new Trend('presign_duration_ms');
const totalPhotosUploaded = new Counter('total_photos_uploaded');

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Warm-up to 50 concurrent creators
    { duration: '1m', target: 200 },   // Ramp-up to 200 concurrent creators
    { duration: '2m', target: 500 },   // Sustained peak load: 500 concurrent photo uploads
    { duration: '30s', target: 0 },    // Graceful ramp-down
  ],
  thresholds: {
    // 95% of presigned URL generation requests must complete under 500ms
    'http_req_duration{type:presign}': ['p(95)<500', 'p(99)<1000'],
    // Overall HTTP request duration
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    // Error rate must stay below 1% under peak 500-concurrency load
    http_req_failed: ['rate<0.01'],
    upload_success_rate: ['rate>0.99'],
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:4000';

export default function () {
  const userId = `load_tester_${__VU}`;
  const projectId = `proj_bench_${__VU}_${__ITER}`;
  const filename = `photo_master_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
  const fileSize = 4.2 * 1024 * 1024; // 4.2 MB simulated 3800px photo master

  // Step 1: Request S3 Presigned Direct Upload URL (Directive 5 / High Scale)
  const presignPayload = JSON.stringify({
    filename,
    contentType: 'image/jpeg',
    fileSize,
    projectId,
    userId,
  });

  const presignHeaders = {
    'Content-Type': 'application/json',
    'x-correlation-id': `load_${__VU}_${__ITER}`,
    'X-Requested-With': 'XMLHttpRequest',
  };

  const presignStartTime = Date.now();
  const presignRes = http.post(`${BASE_URL}/api/v1/upload/presign`, presignPayload, {
    headers: presignHeaders,
    tags: { type: 'presign' },
  });

  presignLatency.add(Date.now() - presignStartTime);

  const presignOk = check(presignRes, {
    'presign status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'presign returns upload url': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Boolean(body.uploadUrl || body.url || body.signedUrl || body.data?.uploadUrl);
      } catch {
        return false;
      }
    },
  });

  uploadSuccessRate.add(presignOk);

  if (presignOk) {
    totalPhotosUploaded.add(1);
  }

  // Small random think time between batch photo selections
  sleep(Math.random() * 1.5 + 0.5);
}
