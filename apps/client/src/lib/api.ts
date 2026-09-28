const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Use /api for seamless backward compatibility and v1 routing
  const url = `${API_BASE}/api${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error?.message || body.error || res.statusText);
  }
  
  return res.json();
}

// Helper to get client auth token from localStorage
function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('pp_token') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Products & Templates
  getProducts: (category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetcher<{ products: any[]; total: number }>(`/products${queryString}`);
  },
  getFeaturedProducts: () => fetcher<{ products: any[] }>('/products/featured'),
  getProduct: (slug: string) => fetcher<any>(`/products/${slug}`),
  getCategories: () => fetcher<{ categories: any[] }>('/products/categories'),
  getProductConfig: () =>
    fetcher<{
      sizes: any[];
      covers: any[];
      themes: any[];
      colors: any[];
      packaging: any[];
      pageCountOptions?: any[];
      pageOptions?: number[];
    }>('/products/config'),

  // Authentication & OTP
  login: (data: { email?: string; phone?: string; identifier?: string; password?: string }) =>
    fetcher<{ token: string; user: any; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  signup: (data: { name: string; email?: string; phone?: string; password?: string }) =>
    fetcher<{ token: string; user: any; message: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  sendOtp: (param: string | { email?: string; phone?: string; identifier?: string }) => {
    const body = typeof param === 'string' 
      ? (param.includes('@') ? { email: param } : { phone: param }) 
      : param;
    return fetcher<{ message: string; devOtp?: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  verifyOtp: (param: { email?: string; phone?: string; identifier?: string; otp: string } | string, maybeOtp?: string) => {
    let body: any;
    if (typeof param === 'string') {
      body = param.includes('@') ? { email: param, otp: maybeOtp } : { phone: param, otp: maybeOtp };
    } else {
      body = param;
    }
    return fetcher<{ token: string; user: any; message?: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  getMe: () => fetcher<{ user: any }>('/auth/me', { headers: authHeaders() }),
  logout: () => fetcher<any>('/auth/logout', { method: 'POST', headers: authHeaders() }),

  // OAuth 2.0 (Google & Apple)
  oauthLogin: (data: { provider: 'google' | 'apple'; email: string; name?: string; avatar?: string; providerId?: string; idToken?: string }) =>
    fetcher<{ token: string; user: any; message: string }>('/auth/oauth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getOAuthConfig: () =>
    fetcher<{
      google: { enabled: boolean; clientId?: string | null; callbackUrl?: string };
      apple: { enabled: boolean; clientId?: string | null; callbackUrl?: string };
    }>('/auth/oauth/config'),

  // Projects & Drafts
  getProjects: () => fetcher<{ projects: any[] }>('/projects', { headers: authHeaders() }),
  getProject: (id: string) => fetcher<any>(`/projects/${id}`, { headers: authHeaders() }),
  createProject: (data: any) =>
    fetcher<{ id: string; project?: any }>('/projects', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
  updateProject: (id: string, data: any) =>
    fetcher<{ message: string; project?: any }>(`/projects/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    fetcher<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),

  // Orders
  getOrders: () => fetcher<{ orders: any[] }>('/orders', { headers: authHeaders() }),
  getOrder: (id: string) => fetcher<any>(`/orders/${id}`, { headers: authHeaders() }),
  createOrder: (data: any) =>
    fetcher<{ id: string; orderNumber?: string; order?: any }>('/orders', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),

  // Shipping & Pincodes
  calculateShipping: (data?: any) =>
    fetcher<{ cost: number; currency: string; note?: string }>('/shipping/calculate', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data || {}),
    }),
  pincodeLookup: (pincode: string) =>
    fetcher<{
      pincode: string;
      city: string;
      state: string;
      isServiceable: boolean;
      estimatedDays?: string;
      courierPartner?: string;
    }>('/shipping/pincode-lookup', {
      method: 'POST',
      body: JSON.stringify({ pincode }),
    }),
  trackShipping: (trackingId: string) =>
    fetcher<{
      trackingId: string;
      status: string;
      carrier: string;
      location: string;
      lastUpdated: string;
    }>(`/shipping/track/${trackingId}`),

  // Payments (Razorpay)
  createPaymentOrder: (data: { amount: number; currency?: string; receipt?: string }) =>
    fetcher<any>('/payments/create-order', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
  verifyPayment: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    fetcher<any>('/payments/verify', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),

  // Customer Support Tickets
  createTicket: (data: { subject: string; message: string; type?: string; orderId?: string }) =>
    fetcher<any>('/tickets', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),

  // Health
  health: () => fetcher<{ status: string; database?: string; cache?: string }>('/health'),
};

export { ApiError };
export default api;
