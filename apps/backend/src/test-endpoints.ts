// apps/backend/src/test-endpoints.ts
import { EventEmitter } from 'events';
import crypto from 'crypto';
import app from './app';
import { env } from './config/env';

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  expectedStatus: number;
  passed: boolean;
  details?: any;
}

const results: TestResult[] = [];

function dispatchRequest(
  method: string,
  url: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any; headers: any }> {
  return new Promise((resolve) => {
    const req: any = new EventEmitter();
    req.method = method;
    req.url = url;
    req.originalUrl = url;
    req.headers = {
      'content-type': 'application/json',
      accept: 'application/json',
      ...headers,
    };
    req.query = {};
    req.params = {};
    req.body = body || {};
    req.rawBody = Buffer.from(JSON.stringify(body || {}));
    req.connection = { remoteAddress: '127.0.0.1' };
    req.socket = { remoteAddress: '127.0.0.1' };
    req.ip = '127.0.0.1';

    let resBody = '';
    const resHeaders: Record<string, any> = {};
    const res: any = new EventEmitter();
    res.statusCode = 200;
    res._headers = resHeaders;
    res.setHeader = (k: string, v: any) => {
      resHeaders[k.toLowerCase()] = v;
    };
    res.getHeader = (k: string) => resHeaders[k.toLowerCase()];
    res.getHeaders = () => resHeaders;
    res.removeHeader = (k: string) => {
      delete resHeaders[k.toLowerCase()];
    };
    res.hasHeader = (k: string) => k.toLowerCase() in resHeaders;
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data: any) => {
      res.emit('finish');
      resolve({ status: res.statusCode, body: data, headers: resHeaders });
      return res;
    };
    res.send = (data: any) => {
      res.emit('finish');
      let parsed = data;
      try {
        parsed = JSON.parse(data);
      } catch {}
      resolve({ status: res.statusCode, body: parsed, headers: resHeaders });
      return res;
    };
    res.end = (data?: any) => {
      res.emit('finish');
      if (data) resBody += data;
      let parsed = resBody;
      try {
        parsed = JSON.parse(resBody);
      } catch {}
      resolve({ status: res.statusCode, body: parsed, headers: resHeaders });
    };

    app(req, res, () => {
      resolve({ status: 404, body: { error: 'Route not handled' }, headers: resHeaders });
    });
  });
}

async function runTests() {
  console.log('\n🧪 ====================================================');
  console.log('🧪 Starting Enterprise Backend API Verification Tests');
  console.log('🧪 ====================================================\n');

  // 1. Health check
  console.log('Testing: GET /api/health');
  const health = await dispatchRequest('GET', '/api/health');
  results.push({
    endpoint: '/api/health',
    method: 'GET',
    status: health.status,
    expectedStatus: 200,
    passed: health.status === 200 && health.body?.status === 'ok',
    details: `Services: db=${health.body?.services?.mongodb}, cache=${health.body?.services?.redis}`,
  });

  // 2. Versioned Products
  console.log('Testing: GET /api/v1/products');
  const v1Products = await dispatchRequest('GET', '/api/v1/products');
  results.push({
    endpoint: '/api/v1/products',
    method: 'GET',
    status: v1Products.status,
    expectedStatus: 200,
    passed: v1Products.status === 200 && Array.isArray(v1Products.body?.products),
    details: `Catalog contains ${v1Products.body?.products?.length || 0} books`,
  });

  // 3. Backward Compatibility Products
  console.log('Testing: GET /api/products (Backward Compatibility)');
  const legacyProducts = await dispatchRequest('GET', '/api/products');
  results.push({
    endpoint: '/api/products',
    method: 'GET',
    status: legacyProducts.status,
    expectedStatus: 200,
    passed: legacyProducts.status === 200 && Array.isArray(legacyProducts.body?.products),
    details: `Catalog contains ${legacyProducts.body?.products?.length || 0} books`,
  });

  // 4. Fuzzy Slug Matching (Paris_1)
  console.log('Testing: GET /api/v1/products/Paris_1');
  const paris = await dispatchRequest('GET', '/api/v1/products/Paris_1');
  results.push({
    endpoint: '/api/v1/products/Paris_1',
    method: 'GET',
    status: paris.status,
    expectedStatus: 200,
    passed: paris.status === 200 && (paris.body?.title?.includes('Paris') || paris.body?.displayName?.includes('Paris')),
    details: `Resolved: "${paris.body?.displayName || paris.body?.title}" (${paris.body?.slug})`,
  });

  // 5. Send OTP to Email
  console.log('Testing: POST /api/v1/auth/send-otp');
  const otpRes = await dispatchRequest('POST', '/api/v1/auth/send-otp', {
    email: 'praveen@perfectpic.in',
  });
  const devOtp = otpRes.body?.devOtp;
  results.push({
    endpoint: '/api/v1/auth/send-otp',
    method: 'POST',
    status: otpRes.status,
    expectedStatus: 200,
    passed: otpRes.status === 200,
    details: `OTP dispatched. DevCode: ${devOtp || 'generated'}`,
  });

  // 6. Verify OTP and Token Issuance
  let userToken = '';
  if (devOtp) {
    console.log(`Testing: POST /api/v1/auth/verify-otp (with code: ${devOtp})`);
    const verifyRes = await dispatchRequest('POST', '/api/v1/auth/verify-otp', {
      email: 'praveen@perfectpic.in',
      otp: devOtp,
    });
    userToken = verifyRes.body?.token || '';
    results.push({
      endpoint: '/api/v1/auth/verify-otp',
      method: 'POST',
      status: verifyRes.status,
      expectedStatus: 200,
      passed: verifyRes.status === 200 && !!userToken,
      details: `JWT Token issued for: ${verifyRes.body?.user?.name || verifyRes.body?.user?.email}`,
    });
  }

  // 7. Multitenancy: User creates scoped project
  const userHeaders: Record<string, string> = userToken ? { authorization: `Bearer ${userToken}` } : {};
  console.log('Testing: POST /api/v1/projects (Tenant Scoped Project Creation)');
  const createProjRes = await dispatchRequest(
    'POST',
    '/api/v1/projects',
    {
      title: 'Himalayan Expedition Photobook',
      template: 'annapurna-base-camp',
      pageCount: 32,
      bookSize: '8.25x8.25',
    },
    userHeaders
  );
  const createdProjId = createProjRes.body?.id || createProjRes.body?.project?._id || createProjRes.body?.project?.id;
  results.push({
    endpoint: '/api/v1/projects (Create)',
    method: 'POST',
    status: createProjRes.status,
    expectedStatus: 201,
    passed: createProjRes.status === 201 && !!createdProjId,
    details: `Created Project ID: ${createdProjId}`,
  });

  // 8. Multitenancy: User lists their projects
  console.log('Testing: GET /api/v1/projects (Owner Listing)');
  const listOwnedRes = await dispatchRequest('GET', '/api/v1/projects', undefined, userHeaders);
  results.push({
    endpoint: '/api/v1/projects (Owner)',
    method: 'GET',
    status: listOwnedRes.status,
    expectedStatus: 200,
    passed: listOwnedRes.status === 200 && Array.isArray(listOwnedRes.body?.projects) && listOwnedRes.body?.projects.length > 0,
    details: `Found ${listOwnedRes.body?.projects?.length || 0} user project(s)`,
  });

  // 9. Multitenancy: Anonymous client lists projects (IDOR Leakage Defense)
  console.log('Testing: GET /api/v1/projects (Anonymous - IDOR Defense)');
  const listAnonRes = await dispatchRequest('GET', '/api/v1/projects');
  results.push({
    endpoint: '/api/v1/projects (Anon)',
    method: 'GET',
    status: listAnonRes.status,
    expectedStatus: 200,
    passed: listAnonRes.status === 200 && listAnonRes.body?.projects?.length === 0,
    details: `Isolated: ${listAnonRes.body?.projects?.length || 0} projects leaked to anonymous callers`,
  });

  // 10. Multitenancy: Attacker attempts to fetch another user's project ID (IDOR Defense)
  console.log('Testing: GET /api/v1/projects/:id (Attacker without auth)');
  const idorRes = await dispatchRequest('GET', `/api/v1/projects/${createdProjId}`);
  results.push({
    endpoint: '/api/v1/projects/:id (IDOR)',
    method: 'GET',
    status: idorRes.status,
    expectedStatus: 404,
    passed: idorRes.status === 404,
    details: `Access denied to unauthenticated actor (Status: ${idorRes.status})`,
  });

  // 11. Admin Login
  console.log('Testing: POST /api/v1/auth/admin/login');
  const adminLogin = await dispatchRequest('POST', '/api/v1/auth/admin/login', {
    email: 'admin@perfectpic.in',
    password: 'Admin123!Secure',
  });
  const adminToken = adminLogin.body?.token;
  const adminHeaders: Record<string, string> = adminToken ? { authorization: `Bearer ${adminToken}` } : {};
  results.push({
    endpoint: '/api/v1/auth/admin/login',
    method: 'POST',
    status: adminLogin.status,
    expectedStatus: 200,
    passed: adminLogin.status === 200 && !!adminToken,
    details: `Role: ${adminLogin.body?.user?.role}, Name: ${adminLogin.body?.user?.name}`,
  });

  // 12. Admin Orders & Stats (with admin token)
  console.log('Testing: GET /api/v1/orders/stats (Authenticated Admin)');
  const stats = await dispatchRequest('GET', '/api/v1/orders/stats', undefined, adminHeaders);
  results.push({
    endpoint: '/api/v1/orders/stats',
    method: 'GET',
    status: stats.status,
    expectedStatus: 200,
    passed: stats.status === 200 && Array.isArray(stats.body?.stats),
    details: `Revenue: ${stats.body?.stats?.find((s: any) => s.label === 'Revenue')?.value || 'N/A'}`,
  });

  // 13. Admin Customers Directory (with admin token)
  console.log('Testing: GET /api/v1/customers (Authenticated Admin)');
  const customers = await dispatchRequest('GET', '/api/v1/customers', undefined, adminHeaders);
  results.push({
    endpoint: '/api/v1/customers',
    method: 'GET',
    status: customers.status,
    expectedStatus: 200,
    passed: customers.status === 200 && Array.isArray(customers.body?.customers),
    details: `${customers.body?.customers?.length || 0} customer records`,
  });

  // 14. Admin Production Queue (with admin token)
  console.log('Testing: GET /api/v1/production (Authenticated Admin)');
  const prod = await dispatchRequest('GET', '/api/v1/production', undefined, adminHeaders);
  results.push({
    endpoint: '/api/v1/production',
    method: 'GET',
    status: prod.status,
    expectedStatus: 200,
    passed: prod.status === 200 && Array.isArray(prod.body?.columns),
    details: `${prod.body?.columns?.length || 0} fulfillment stages`,
  });

  // 15. Admin Tickets (with admin token)
  console.log('Testing: GET /api/v1/tickets (Authenticated Admin)');
  const tickets = await dispatchRequest('GET', '/api/v1/tickets', undefined, adminHeaders);
  results.push({
    endpoint: '/api/v1/tickets',
    method: 'GET',
    status: tickets.status,
    expectedStatus: 200,
    passed: tickets.status === 200 && Array.isArray(tickets.body?.tickets),
    details: `${tickets.body?.tickets?.length || 0} support tickets`,
  });

  // 16. Shipping calculate (Public calculation)
  console.log('Testing: POST /api/v1/shipping/calculate');
  const shipping = await dispatchRequest('POST', '/api/v1/shipping/calculate', {});
  results.push({
    endpoint: '/api/v1/shipping/calculate',
    method: 'POST',
    status: shipping.status,
    expectedStatus: 200,
    passed: shipping.status === 200 && shipping.body?.currency === 'INR',
    details: shipping.body?.note || 'Pan-India free shipping',
  });

  // 17. Admin Analytics Dashboard (with admin token)
  console.log('Testing: GET /api/v1/analytics/dashboard (Authenticated Admin)');
  const analytics = await dispatchRequest('GET', '/api/v1/analytics/dashboard', undefined, adminHeaders);
  results.push({
    endpoint: '/api/v1/analytics/dashboard',
    method: 'GET',
    status: analytics.status,
    expectedStatus: 200,
    passed: analytics.status === 200 && analytics.body?.success,
    details: `Dashboard metrics envelope OK`,
  });

  // 18. Payment Gateway: Create Razorpay Order
  console.log('Testing: POST /api/v1/payments/create-order');
  const createPayRes = await dispatchRequest('POST', '/api/v1/payments/create-order', {
    amount: 1999,
  });
  results.push({
    endpoint: '/api/v1/payments/create-order',
    method: 'POST',
    status: createPayRes.status,
    expectedStatus: 200,
    passed: createPayRes.status === 200 && (createPayRes.body?.id || createPayRes.body?.order_id),
    details: `Order created: ${createPayRes.body?.id || 'OK'} (Amount: ₹${(createPayRes.body?.amount || 199900) / 100})`,
  });

  // 19. Payment Gateway: Verify Payment
  console.log('Testing: POST /api/v1/payments/verify');
  const testOrderId = createPayRes.body?.id || 'order_mock_test';
  const testPaymentId = 'pay_mock_test_123';
  const expectedSig = env.RAZORPAY_KEY_SECRET
    ? crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET).update(`${testOrderId}|${testPaymentId}`).digest('hex')
    : 'sig_mock_test';

  const verifyPayRes = await dispatchRequest('POST', '/api/v1/payments/verify', {
    razorpay_order_id: testOrderId,
    razorpay_payment_id: testPaymentId,
    razorpay_signature: expectedSig,
  });
  results.push({
    endpoint: '/api/v1/payments/verify',
    method: 'POST',
    status: verifyPayRes.status,
    expectedStatus: 200,
    passed: verifyPayRes.status === 200,
    details: verifyPayRes.body?.message || 'Payment verified',
  });

  // 20. Payment Gateway: Webhook Idempotency & Duplicate Rejection
  console.log('Testing: POST /api/v1/payments/webhook (Idempotent Webhook Processing)');
  const webhookEventId = `evt_test_${Date.now()}`;
  const webhookPayload = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: `pay_webhook_${Date.now()}`,
          amount: 199900,
          currency: 'INR',
          status: 'captured',
          order_id: createPayRes.body?.id || 'order_mock_test',
        },
      },
    },
  };

  const webhookBodyStr = JSON.stringify(webhookPayload);
  const webhookHeaders: Record<string, string> = {
    'x-razorpay-event-id': webhookEventId,
  };
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_KEY_SECRET;
  if (webhookSecret) {
    webhookHeaders['x-razorpay-signature'] = crypto
      .createHmac('sha256', webhookSecret)
      .update(webhookBodyStr)
      .digest('hex');
  }

  const firstWebhookRes = await dispatchRequest('POST', '/api/v1/payments/webhook', webhookPayload, webhookHeaders);
  // Duplicate delivery of the exact same event ID
  const duplicateWebhookRes = await dispatchRequest('POST', '/api/v1/payments/webhook', webhookPayload, webhookHeaders);
  const idempotencyPassed =
    firstWebhookRes.status === 200 &&
    duplicateWebhookRes.status === 200 &&
    duplicateWebhookRes.body?.status === 'already_processed';

  results.push({
    endpoint: '/api/v1/payments/webhook (Idempotency)',
    method: 'POST',
    status: duplicateWebhookRes.status,
    expectedStatus: 200,
    passed: idempotencyPassed,
    details: `First: ${firstWebhookRes.body?.status || 'ok'}, Duplicate: ${duplicateWebhookRes.body?.status} (Lock held)`,
  });

  // Print results
  console.log('\n📊 ====================================================');
  console.log('📊 PerfectPic Backend API Verification Summary');
  console.log('📊 ====================================================\n');

  let passedCount = 0;
  for (const r of results) {
    const symbol = r.passed ? '✅' : '❌';
    console.log(`${symbol} [${r.method}] ${r.endpoint.padEnd(32)} HTTP ${r.status} (${r.details || ''})`);
    if (r.passed) passedCount++;
  }

  console.log(`\n🎉 Total: ${passedCount}/${results.length} tests PASSED!`);

  if (passedCount < results.length) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
