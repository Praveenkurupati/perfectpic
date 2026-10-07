import { getApiBaseUrl } from './urls';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Use /api for seamless backward compatibility and v1 routing
  const url = `${getApiBaseUrl()}/api${endpoint}`;
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
  getProducts: (param?: string | { category?: string; search?: string; page?: number; limit?: number }, maybeSearch?: string) => {
    const params = new URLSearchParams();
    if (typeof param === 'string') {
      if (param && param !== 'all') params.append('category', param);
      if (maybeSearch) params.append('search', maybeSearch);
    } else if (param) {
      if (param.category && param.category !== 'all') params.append('category', param.category);
      if (param.search) params.append('search', param.search);
      if (param.page) params.append('page', String(param.page));
      if (param.limit) params.append('limit', String(param.limit));
    }
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetcher<{ products: any[]; total: number; page?: number; totalPages?: number; limit?: number }>(`/products${queryString}`);
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
  getPageOptions: () => fetcher<{ pageOptions: any[]; total: number }>('/page-options'),
  getBundles: () => fetcher<{ bundles: any[]; total: number }>('/bundles'),

  // Authentication & OTP
  login: (data: { email?: string; phone?: string; identifier?: string; password?: string }) =>
    fetcher<{ token: string; user: any; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  signup: (data: { name: string; email: string; phone?: string; password?: string; otp?: string }) =>
    fetcher<{ token?: string; user?: any; otpRequired?: boolean; message: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  sendOtp: (param: string | { email?: string; phone?: string; identifier?: string; name?: string; purpose?: 'login' | 'signup' }) => {
    const body = typeof param === 'string' 
      ? (param.includes('@') ? { email: param } : { phone: param }) 
      : param;
    return fetcher<{ message: string; devOtp?: string; success?: boolean }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  verifyOtp: (param: { email?: string; phone?: string; identifier?: string; otp: string; name?: string; password?: string } | string, maybeOtp?: string) => {
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
  getProjects: (opts?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (opts?.page) params.append('page', String(opts.page));
    if (opts?.limit) params.append('limit', String(opts.limit));
    if (opts?.status) params.append('status', opts.status);
    if (opts?.search) params.append('search', opts.search);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetcher<{ projects: any[]; total: number; page?: number; totalPages?: number; limit?: number }>(`/projects${queryString}`, { headers: authHeaders() });
  },
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
  getOrders: (opts?: { page?: number; limit?: number; status?: string }) => {
    const params = new URLSearchParams();
    if (opts?.page) params.append('page', String(opts.page));
    if (opts?.limit) params.append('limit', String(opts.limit));
    if (opts?.status) params.append('status', opts.status);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetcher<{ orders: any[]; total: number; page?: number; totalPages?: number; limit?: number }>(`/orders${queryString}`, { headers: authHeaders() });
  },
  getOrder: (id: string, opts?: { email?: string; token?: string }) => {
    const params = new URLSearchParams();
    if (opts?.email) params.append('email', opts.email);
    if (opts?.token) params.append('token', opts.token);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const headers: Record<string, string> = { ...(authHeaders() as Record<string, string>) };
    if (opts?.token) {
      headers['x-guest-token'] = opts.token;
    }
    return fetcher<any>(`/orders/${id}${qs}`, { headers });
  },
  createOrder: (data: any) =>
    fetcher<{ id: string; orderNumber?: string; order?: any }>('/orders', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
  submitReview: (orderId: string, data: any) =>
    fetcher<{ message: string; review: any }>(`/orders/${orderId}/review`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
  getOrderReview: (orderId: string) =>
    fetcher<{ review: any }>(`/orders/${orderId}/review`, {
      headers: authHeaders(),
    }),

  // Customer Addresses
  getAddresses: () =>
    fetcher<{ addresses: any[]; total?: number }>('/addresses', {
      headers: authHeaders(),
    }),
  createAddress: (data: any) =>
    fetcher<{ address: any; message: string }>('/addresses', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
  updateAddress: (id: string, data: any) =>
    fetcher<{ address: any; message: string }>(`/addresses/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
  deleteAddress: (id: string) =>
    fetcher<{ message: string }>(`/addresses/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),
  setDefaultAddress: (id: string) =>
    fetcher<{ message: string; addresses: any[] }>(`/addresses/${id}/default`, {
      method: 'PUT',
      headers: authHeaders(),
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

  // Authoritative Pricing & Payments (Razorpay)
  calculatePricing: (data: {
    items?: any[];
    accessories?: any;
    packaging?: any;
    promoCode?: string | null;
    deliveryOption?: string;
  }) =>
    fetcher<{ success: boolean; pricing: any }>('/pricing/calculate', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
  createPaymentOrder: (data: {
    amount?: number;
    items?: any[];
    accessories?: any;
    promoCode?: string | null;
    deliveryOption?: string;
    currency?: string;
    receipt?: string;
  }) =>
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

  // Presigned S3 direct uploads
  getPresignedUploadUrl: async (filename: string, contentType: string) => {
    return fetcher<{ url: string; key: string }>('/upload/presign', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ filename, contentType }),
    });
  },

  // Uploads (Direct-to-S3 presigned PUT with local streaming fallback)
  uploadPhoto: async (file: File) => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('pp_token') || localStorage.getItem('token')) : null;

    // 1. Attempt Direct-to-S3 Presigned PUT
    try {
      const presignRes = await fetch(`${getApiBaseUrl()}/api/v1/upload/presign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'image/jpeg',
        }),
      });

      if (presignRes.ok) {
        const { url: presignedPutUrl, key } = await presignRes.json();

        // If real S3 presigned URL (not mock S3), upload directly to S3
        if (presignedPutUrl && presignedPutUrl.includes('.amazonaws.com') && !presignedPutUrl.includes('mock-s3-bucket')) {
          const directRes = await fetch(presignedPutUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': file.type || 'image/jpeg',
            },
            body: file,
          });

          if (directRes.ok) {
            // Clean direct S3 public URL
            const publicUrl = presignedPutUrl.split('?')[0];
            return {
              url: publicUrl,
              filename: key,
              originalName: file.name,
              size: file.size,
              storage: 's3-direct',
            };
          }
        }
      }
    } catch (presignErr) {
      console.warn('Presigned direct upload unavailable; cascading to fallback streaming:', presignErr);
    }

    // 2. Fallback streaming via Express (for local offline dev environments)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'photos');
    const res = await fetch(`${getApiBaseUrl()}/api/v1/upload/file`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to upload photo');
    }
    return res.json() as Promise<{ url: string; filename: string; originalName: string; size: number }>;
  },
  uploadPdf: async (blobOrFile: Blob | File, filename?: string, orderId?: string) => {
    const formData = new FormData();
    const fname = filename || `photobook-${Date.now()}.pdf`;
    const file = blobOrFile instanceof File ? blobOrFile : new File([blobOrFile], fname, { type: 'application/pdf' });
    formData.append('file', file);
    formData.append('folder', 'photobooks');
    if (orderId) formData.append('orderId', orderId);

    const token = typeof window !== 'undefined' ? (localStorage.getItem('pp_token') || localStorage.getItem('token')) : null;
    const res = await fetch(`${getApiBaseUrl()}/api/v1/upload/file`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to upload photobook PDF to S3');
    }
    return res.json() as Promise<{ url: string; filename: string; originalName: string; size: number }>;
  },
  updateOrderPdf: (orderId: string, pdfUrl: string) =>
    fetcher<{ message: string; order: any }>(`/orders/${orderId}/pdf`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ pdfUrl }),
    }),

  // Promo Codes & Coupons
  validatePromoCode: (data: { code: string; subtotal: number; customerEmail?: string; customerPhone?: string; userId?: string }) =>
    fetcher<{
      valid: boolean;
      code: string;
      promoId: string;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
      maxDiscountAmount: number | null;
      discountAmount: number;
      minOrderAmount: number;
      description: string;
      message: string;
    }>('/promos/validate', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
  getActivePromoOffers: () =>
    fetcher<{
      offers: Array<{
        code: string;
        description?: string;
        discountType: 'percentage' | 'fixed';
        discountValue: number;
        maxDiscountAmount?: number | null;
        minOrderAmount: number;
        audienceType: string;
        expiresAt?: string | null;
      }>;
    }>('/promos/active'),

  // Health
  health: () => fetcher<{ status: string; database?: string; cache?: string }>('/health'),
};

export { ApiError };
export default api;
