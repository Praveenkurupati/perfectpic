// apps/backend/src/test-endpoints.ts
import { EventEmitter } from 'events';
import app from './app';

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
  console.log('🧪 Starting Enterprise Backend In-Memory API Tests');
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
    details: `OTP dispatched to email. Code: ${devOtp || 'generated'}`,
  });

  // 6. Verify OTP and Token Issuance
  if (devOtp) {
    console.log(`Testing: POST /api/v1/auth/verify-otp (with code: ${devOtp})`);
    const verifyRes = await dispatchRequest('POST', '/api/v1/auth/verify-otp', {
      email: 'praveen@perfectpic.in',
      otp: devOtp,
    });
    results.push({
      endpoint: '/api/v1/auth/verify-otp',
      method: 'POST',
      status: verifyRes.status,
      expectedStatus: 200,
      passed: verifyRes.status === 200 && !!verifyRes.body?.token,
      details: `JWT Token issued for: ${verifyRes.body?.user?.name || verifyRes.body?.user?.email}`,
    });
  }

  // 7. Admin Login
  console.log('Testing: POST /api/v1/auth/admin/login');
  const adminLogin = await dispatchRequest('POST', '/api/v1/auth/admin/login', {
    email: 'admin@perfectpic.in',
    password: 'Admin123!Secure',
  });
  results.push({
    endpoint: '/api/v1/auth/admin/login',
    method: 'POST',
    status: adminLogin.status,
    expectedStatus: 200,
    passed: adminLogin.status === 200 && !!adminLogin.body?.token,
    details: `Role: ${adminLogin.body?.user?.role}, Name: ${adminLogin.body?.user?.name}`,
  });

  // 8. Orders & Stats
  console.log('Testing: GET /api/v1/orders/stats');
  const stats = await dispatchRequest('GET', '/api/v1/orders/stats');
  results.push({
    endpoint: '/api/v1/orders/stats',
    method: 'GET',
    status: stats.status,
    expectedStatus: 200,
    passed: stats.status === 200 && Array.isArray(stats.body?.stats),
    details: `Revenue: ${stats.body?.stats?.find((s: any) => s.label === 'Revenue')?.value || 'N/A'}`,
  });

  // 9. Customers Directory
  console.log('Testing: GET /api/v1/customers');
  const customers = await dispatchRequest('GET', '/api/v1/customers');
  results.push({
    endpoint: '/api/v1/customers',
    method: 'GET',
    status: customers.status,
    expectedStatus: 200,
    passed: customers.status === 200 && Array.isArray(customers.body?.customers),
    details: `${customers.body?.customers?.length || 0} customer records`,
  });

  // 10. Production Queue
  console.log('Testing: GET /api/v1/production');
  const prod = await dispatchRequest('GET', '/api/v1/production');
  results.push({
    endpoint: '/api/v1/production',
    method: 'GET',
    status: prod.status,
    expectedStatus: 200,
    passed: prod.status === 200 && Array.isArray(prod.body?.columns),
    details: `${prod.body?.columns?.length || 0} fulfillment stages`,
  });

  // 11. Tickets
  console.log('Testing: GET /api/v1/tickets');
  const tickets = await dispatchRequest('GET', '/api/v1/tickets');
  results.push({
    endpoint: '/api/v1/tickets',
    method: 'GET',
    status: tickets.status,
    expectedStatus: 200,
    passed: tickets.status === 200 && Array.isArray(tickets.body?.tickets),
    details: `${tickets.body?.tickets?.length || 0} support tickets`,
  });

  // 12. Shipping calculate
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

  // 13. Analytics Dashboard
  console.log('Testing: GET /api/v1/analytics/dashboard');
  const analytics = await dispatchRequest('GET', '/api/v1/analytics/dashboard');
  results.push({
    endpoint: '/api/v1/analytics/dashboard',
    method: 'GET',
    status: analytics.status,
    expectedStatus: 200,
    passed: analytics.status === 200 && analytics.body?.success,
    details: `Dashboard metrics envelope OK`,
  });

  // Print results
  console.log('\n📊 ====================================================');
  console.log('📊 PerfectPic Backend Test Summary');
  console.log('📊 ====================================================\n');

  let passedCount = 0;
  for (const r of results) {
    const symbol = r.passed ? '✅' : '❌';
    console.log(`${symbol} [${r.method}] ${r.endpoint.padEnd(30)} HTTP ${r.status} (${r.details || ''})`);
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
