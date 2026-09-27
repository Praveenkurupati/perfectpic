const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
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
    throw new ApiError(res.status, body.error || res.statusText);
  }
  
  return res.json();
}

// Helper to get auth header
function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('pp_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Products
  getProducts: (category?: string) => {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    return fetcher<{ products: any[]; total: number }>(`/products${params}`);
  },
  getFeaturedProducts: () => fetcher<{ products: any[] }>('/products/featured'),
  getProduct: (slug: string) => fetcher<any>(`/products/${slug}`),
  getCategories: () => fetcher<{ categories: any[] }>('/products/categories'),
  getProductConfig: () => fetcher<{ sizes: any[]; covers: any[]; themes: any[]; colors: any[]; packaging: any[] }>('/products/config'),
  
  // Auth
  sendOtp: (phone: string) => fetcher<{ message: string }>('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOtp: (phone: string, otp: string) => fetcher<{ token: string; user: any }>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) }),
  getMe: () => fetcher<{ user: any }>('/auth/me', { headers: authHeaders() }),
  
  // Projects  
  getProjects: () => fetcher<{ projects: any[] }>('/projects', { headers: authHeaders() }),
  getProject: (id: string) => fetcher<any>(`/projects/${id}`, { headers: authHeaders() }),
  createProject: (data: any) => fetcher<{ id: string }>('/projects', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }),
  
  // Orders
  getOrders: () => fetcher<{ orders: any[] }>('/orders', { headers: authHeaders() }),
  getOrder: (id: string) => fetcher<any>(`/orders/${id}`, { headers: authHeaders() }),
  createOrder: (data: any) => fetcher<{ id: string }>('/orders', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }),
  
  // Health
  health: () => fetcher<{ status: string }>('/health'),
};

export { ApiError };
export default api;
