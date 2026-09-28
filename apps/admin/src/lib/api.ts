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

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const adminApi = {
  // Auth
  login: (data: { email?: string; identifier?: string; password?: string }) =>
    fetcher<{ token: string; user: any; message: string }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Orders
  getOrders: () => fetcher<{ orders: any[] }>('/orders', { headers: authHeaders() }),
  getOrder: (id: string) => fetcher<any>(`/orders/${id}`, { headers: authHeaders() }),
  updateOrderStatus: (id: string, status: string) => fetcher<any>(`/orders/${id}/status`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ status }) }),
  
  // Products & Templates
  getProducts: (category?: string) => {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    return fetcher<{ products: any[]; total: number }>(`/products${params}`);
  },
  getProduct: (idOrSlug: string) => fetcher<any>(`/products/${idOrSlug}`),
  createProduct: (data: any) => fetcher<{ message: string; product: any }>('/products', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }),
  updateProduct: (id: string, data: any) => fetcher<{ message: string; product: any }>(`/products/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }),
  deleteProduct: (id: string) => fetcher<{ message: string }>(`/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }),
  getProductConfig: () => fetcher<any>('/products/config'),
  
  // Projects
  getProjects: () => fetcher<{ projects: any[] }>('/projects', { headers: authHeaders() }),

  // Customers
  getCustomers: (search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return fetcher<{ customers: any[]; total: number }>(`/customers${params}`, { headers: authHeaders() });
  },

  // Production Queue
  getProductionQueue: () => fetcher<{ columns: any[]; queue: any[] }>('/production', { headers: authHeaders() }),
  advanceProduction: (orderId: string, status: string) =>
    fetcher<any>(`/production/${orderId}/status`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    }),

  // Support Tickets
  getTickets: (status?: string) => {
    const params = status && status !== 'All' ? `?status=${encodeURIComponent(status)}` : '';
    return fetcher<{ tickets: any[]; total: number }>(`/tickets${params}`, { headers: authHeaders() });
  },
  createTicket: (data: any) =>
    fetcher<any>('/tickets', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
  updateTicketStatus: (id: string, status: string) =>
    fetcher<any>(`/tickets/${id}/status`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    }),

  // Analytics & Dashboard
  getDashboardStats: () => fetcher<any>('/analytics/dashboard', { headers: authHeaders() }),
  getRevenueTrend: () => fetcher<any>('/analytics/revenue', { headers: authHeaders() }),

  // Health
  health: () => fetcher<{ status: string }>('/health'),
};

export { ApiError };
export default adminApi;
