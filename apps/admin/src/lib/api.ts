import { getApiBaseUrl } from './urls';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
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
  getOrders: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.status && params.status !== 'All') query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetcher<{ orders: any[]; total: number; page?: number; totalPages?: number; limit?: number }>(`/orders${qs}`, { headers: authHeaders() });
  },
  getOrder: (id: string) => fetcher<any>(`/orders/${id}`, { headers: authHeaders() }),
  updateOrderStatus: (
    id: string,
    status: string,
    additionalData?: {
      notes?: string;
      carrier?: string;
      trackingNumber?: string;
      trackingUrl?: string;
      updatedBy?: string;
    }
  ) =>
    fetcher<any>(`/orders/${id}/status`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status, ...additionalData }),
    }),
  updateOrderAddress: (id: string, shippingAddress: any) =>
    fetcher<{ message: string; order: any }>(`/orders/${id}/address`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ shippingAddress }),
    }),
  uploadOrderPdf: async (blobOrFile: Blob | File, orderId: string, customFilename?: string) => {
    const cleanId = String(orderId).replace(/[^a-zA-Z0-9_-]/g, '') || `ORD-${Date.now()}`;
    const canonicalFilename = customFilename || `PerfectPic-Photobook-${cleanId}.pdf`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

    // 1. Attempt Direct-to-S3 Presigned PUT
    try {
      const presignRes = await fetch(`${getApiBaseUrl()}/api/v1/upload/presign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          filename: canonicalFilename,
          contentType: 'application/pdf',
          folder: 'photobooks',
          orderId: cleanId,
        }),
      });

      if (presignRes.ok) {
        const { url: presignedPutUrl, key, publicUrl } = await presignRes.json();

        if (presignedPutUrl && presignedPutUrl.includes('.amazonaws.com') && !presignedPutUrl.includes('mock-s3-bucket')) {
          const directPutRes = await fetch(presignedPutUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/pdf',
            },
            body: blobOrFile,
          });

          if (directPutRes.ok) {
            const canonicalUrl = publicUrl || presignedPutUrl.split('?')[0];
            await adminApi.confirmOrderPdf(cleanId, canonicalUrl, key).catch(() => {});
            return {
              url: canonicalUrl,
              filename: key,
              originalName: canonicalFilename,
              storage: 's3-presigned',
            };
          }
        }
      }
    } catch (presignErr) {
      console.warn('Notice: Admin presigned direct upload failed; falling back to streaming:', presignErr);
    }

    // 2. Fallback streaming upload via backend
    const formData = new FormData();
    const file = blobOrFile instanceof File ? blobOrFile : new File([blobOrFile], canonicalFilename, { type: 'application/pdf' });
    formData.append('file', file);
    formData.append('folder', 'photobooks');
    formData.append('orderId', cleanId);

    const res = await fetch(`${getApiBaseUrl()}/api/v1/upload/file`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to upload photobook PDF to S3');
    }
    const result = (await res.json()) as { url: string; filename: string; originalName: string; size: number };
    if (result?.url) {
      await adminApi.updateOrderPdf(cleanId, result.url).catch(() => {});
    }
    return result;
  },

  uploadPdf: async (blobOrFile: Blob | File, filename?: string, orderId?: string) => {
    if (orderId) {
      return adminApi.uploadOrderPdf(blobOrFile, orderId, filename);
    }
    const formData = new FormData();
    const fname = filename || `photobook-${Date.now()}.pdf`;
    const file = blobOrFile instanceof File ? blobOrFile : new File([blobOrFile], fname, { type: 'application/pdf' });
    formData.append('file', file);
    formData.append('folder', 'photobooks');

    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
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
  confirmOrderPdf: (orderId: string, pdfUrl: string, key?: string) =>
    fetcher<{ success: boolean; pdfUrl: string; key: string; order: any }>('/upload/confirm-order-pdf', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ orderId, pdfUrl, key }),
    }),
  updateOrderPdf: (orderId: string, pdfUrl: string) =>
    fetcher<{ message: string; order: any }>(`/orders/${orderId}/pdf`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ pdfUrl }),
    }),
  
  // Products & Templates
  getProducts: (param?: string | { category?: string; page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (typeof param === 'string') {
      if (param && param !== 'all') query.append('category', param);
    } else if (param) {
      if (param.category && param.category !== 'all') query.append('category', param.category);
      if (param.page) query.append('page', String(param.page));
      if (param.limit) query.append('limit', String(param.limit));
      if (param.search) query.append('search', param.search);
    }
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetcher<{ products: any[]; total: number; page?: number; totalPages?: number; limit?: number }>(`/products${qs}`);
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
  
  // Page Options (1 photo per page rules, capacity tiers, badges, pricing)
  getPageOptions: () => fetcher<{ pageOptions: any[]; total: number }>('/page-options'),
  getAllPageOptions: () =>
    fetcher<{ pageOptions: any[]; total: number }>('/page-options/all', {
      headers: authHeaders(),
    }),
  getPageOption: (id: string) =>
    fetcher<any>(`/page-options/${id}`, { headers: authHeaders() }),
  createPageOption: (data: any) =>
    fetcher<{ message: string; pageOption: any }>('/page-options', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
  updatePageOption: (id: string, data: any) =>
    fetcher<{ message: string; pageOption: any }>(`/page-options/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
  deletePageOption: (id: string) =>
    fetcher<{ message: string }>(`/page-options/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),
  resetPageOptions: () =>
    fetcher<{ message: string; pageOptions: any[] }>('/page-options/reset', {
      method: 'POST',
      headers: authHeaders(),
    }),
  
  // Projects & Abandoned Draft Recovery
  getProjects: () => fetcher<{ projects: any[] }>('/projects', { headers: authHeaders() }),
  getAbandonedDrafts: (params?: { stage?: string | number; search?: string; hours?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.stage !== undefined && params.stage !== 'all') qs.set('stage', String(params.stage));
    if (params?.search) qs.set('search', params.search);
    if (params?.hours) qs.set('hours', String(params.hours));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetcher<{ projects: any[]; total: number }>(`/projects/abandoned${query}`, { headers: authHeaders() });
  },
  getDraftRecoveryMetrics: () =>
    fetcher<{
      totalTrappedRevenue: number;
      totalAbandonedDrafts: number;
      recoveredCount: number;
      recoveredRevenue: number;
      recoveryRatePercentage: number;
      stageBreakdown: { stage1: number; stage2: number; stage3: number };
      channelDeliveryRate: { whatsapp: number; email: number };
      lastRunAt: string;
    }>('/projects/recovery-metrics', { headers: authHeaders() }),
  sendDraftReminder: (
    projectId: string,
    data: {
      channel?: 'whatsapp' | 'email' | 'all';
      stage?: number;
      customPhone?: string;
      customEmail?: string;
      customName?: string;
      promoCode?: string;
    }
  ) =>
    fetcher<any>(`/projects/${projectId}/reminder`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
  processBatchDraftReminders: () =>
    fetcher<{
      message: string;
      summary: {
        processed: number;
        successful: number;
        stage1Count: number;
        stage2Count: number;
        stage3Count: number;
      };
    }>('/projects/process-reminders', {
      method: 'POST',
      headers: authHeaders(),
    }),

  // Anniversary & Milestone CRM Retention Engine
  getUpcomingAnniversaries: (params?: { stage?: string | number; search?: string; daysWindow?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.stage !== undefined && params.stage !== 'all') qs.set('stage', String(params.stage));
    if (params?.search) qs.set('search', params.search);
    if (params?.daysWindow) qs.set('daysWindow', String(params.daysWindow));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetcher<{ success: boolean; count: number; candidates: any[] }>(`/anniversary/upcoming${query}`, { headers: authHeaders() });
  },
  getAnniversaryMetrics: () =>
    fetcher<{
      success: boolean;
      metrics: {
        totalUpcomingMilestones30d: number;
        totalUpcomingMilestones60d: number;
        totalRemindersSent: number;
        repeatConversionRate: number;
        attributedRevenue: number;
        repeatOrdersCount: number;
        stageBreakdown: { stage1: number; stage2: number; stage3: number };
        occasionBreakdown: Record<string, number>;
        channelDeliveryRate: { whatsapp: number; email: number };
        lastSweepAt?: string;
      };
    }>('/anniversary/metrics', { headers: authHeaders() }),
  triggerAnniversaryReminder: (
    orderId: string,
    data?: {
      stage?: number;
      channel?: 'whatsapp' | 'email' | 'all';
      customPromo?: string;
      customPhone?: string;
      customEmail?: string;
    }
  ) =>
    fetcher<{ success: boolean; result: any; message: string }>(`/anniversary/trigger/${orderId}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data || {}),
    }),
  previewAnniversaryTemplates: (orderId: string, params?: { stage?: number; promoCode?: string }) => {
    const qs = new URLSearchParams();
    if (params?.stage) qs.set('stage', String(params.stage));
    if (params?.promoCode) qs.set('promoCode', params.promoCode);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetcher<{ success: boolean; preview: any }>(`/anniversary/preview/${orderId}${query}`, { headers: authHeaders() });
  },
  processAnniversarySweep: () =>
    fetcher<{ success: boolean; summary: any; message: string }>('/anniversary/sweep', {
      method: 'POST',
      headers: authHeaders(),
    }),

  // Customers
  getCustomers: (param?: string | { search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (typeof param === 'string') {
      if (param) query.append('search', param);
    } else if (param) {
      if (param.search) query.append('search', param.search);
      if (param.page) query.append('page', String(param.page));
      if (param.limit) query.append('limit', String(param.limit));
    }
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetcher<{ customers: any[]; total: number; page?: number; totalPages?: number; limit?: number }>(`/customers${qs}`, { headers: authHeaders() });
  },

  // Production Queue & Fulfillment Pipeline
  getProductionQueue: () => fetcher<{ columns: any[]; queue: any[]; stats?: any; totalOrders?: number }>('/production', { headers: authHeaders() }),
  advanceProduction: (orderId: string, status: string) =>
    fetcher<any>(`/production/${orderId}/status`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    }),

  // Headless Print Worker Queue Telemetry & Management
  getQueueStats: () =>
    fetcher<{
      success: boolean;
      isRedisConnected: boolean;
      timestamp: string;
      uptimeSeconds: number;
      memoryUsageMb: { rss: number; heapTotal: number; heapUsed: number };
      totals: { waiting: number; active: number; failed: number; completed: number };
      queues: Record<string, { waiting: number; active: number; completed: number; failed: number; total: number }>;
    }>('/queues/stats', { headers: authHeaders() }),

  getQueueJobs: (params?: { queue?: string; status?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.queue) qs.set('queue', params.queue);
    if (params?.status) qs.set('status', params.status);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetcher<{
      success: boolean;
      queue: string;
      status: string;
      count: number;
      jobs: Array<{
        id: string;
        name: string;
        status: string;
        progress: number;
        attempts: number;
        maxAttempts: number;
        failedReason?: string;
        stackTrace?: string[];
        createdAt: number;
        processedAt?: number;
        finishedAt?: number;
        data?: any;
      }>;
    }>(`/queues/jobs${query}`, { headers: authHeaders() });
  },

  retryQueueJob: (jobId: string, queue: string = 'print-render-queue') =>
    fetcher<{ success: boolean; message: string; job: any }>(`/queues/retry/${jobId}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ queue }),
    }),

  triggerOrderPrintRender: (orderId: string) =>
    fetcher<{ success: boolean; message: string; jobId: string }>(`/queues/render-order/${orderId}`, {
      method: 'POST',
      headers: authHeaders(),
    }),

  removeQueueJob: (jobId: string, queue: string = 'print-render-queue') =>
    fetcher<{ success: boolean; message: string }>(`/queues/jobs/${jobId}?queue=${encodeURIComponent(queue)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),

  // Support Tickets
  getTickets: (statusOrParams?: string | { status?: string; page?: number; limit?: number }, page?: number, limit?: number) => {
    const query = new URLSearchParams();
    if (typeof statusOrParams === 'string') {
      if (statusOrParams && statusOrParams !== 'All') query.append('status', statusOrParams);
      if (page) query.append('page', String(page));
      if (limit) query.append('limit', String(limit));
    } else if (statusOrParams) {
      if (statusOrParams.status && statusOrParams.status !== 'All') query.append('status', statusOrParams.status);
      if (statusOrParams.page) query.append('page', String(statusOrParams.page));
      if (statusOrParams.limit) query.append('limit', String(statusOrParams.limit));
    }
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetcher<{ tickets: any[]; total: number; page?: number; totalPages?: number; limit?: number }>(`/tickets${qs}`, { headers: authHeaders() });
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

  // Analytics & Command Center
  getDashboardStats: () => fetcher<any>('/analytics/dashboard', { headers: authHeaders() }),
  getCommandCenterStats: () => fetcher<any>('/analytics/command-center', { headers: authHeaders() }),
  getSlaMetrics: () => fetcher<any>('/analytics/sla', { headers: authHeaders() }),
  getAlerts: () => fetcher<{ alerts: any[]; total: number }>('/analytics/alerts', { headers: authHeaders() }),
  getFinancials: () => fetcher<any>('/analytics/financials', { headers: authHeaders() }),
  getFunnelAnalytics: () => fetcher<any>('/analytics/funnel', { headers: authHeaders() }),
  getDailySummary: () => fetcher<any>('/analytics/daily-summary', { headers: authHeaders() }),
  getRevenueTrend: () => fetcher<any>('/analytics/revenue', { headers: authHeaders() }),
  getBehaviourAnalytics: (filters?: Record<string, string>) => {
    const params = new URLSearchParams(filters || {}).toString();
    return fetcher<any>(`/analytics/behaviour${params ? `?${params}` : ''}`, { headers: authHeaders() });
  },
  getLiveFeed: (limit: number = 20) =>
    fetcher<any>(`/analytics/live-feed?limit=${limit}`, { headers: authHeaders() }),

  // Promo Codes & Coupons Management
  getPromos: (filters?: { status?: string; search?: string; audience?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.audience && filters.audience !== 'ALL') params.set('audience', filters.audience);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetcher<{ promos: any[]; total: number }>(`/promos${queryString}`, { headers: authHeaders() });
  },
  getPromo: (id: string) => fetcher<any>(`/promos/${id}`, { headers: authHeaders() }),
  createPromo: (data: any) =>
    fetcher<{ message: string; promo: any }>('/promos', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
  updatePromo: (id: string, data: any) =>
    fetcher<{ message: string; promo: any }>(`/promos/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
  deletePromo: (id: string) =>
    fetcher<{ success: boolean; message: string }>(`/promos/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),
  togglePromoStatus: (id: string) =>
    fetcher<{ message: string; promo: any }>(`/promos/${id}/toggle`, {
      method: 'PATCH',
      headers: authHeaders(),
    }),
  getPromoUsages: (id: string) =>
    fetcher<{ promo: any; usages: any[]; totalUsages: number }>(`/promos/${id}/usages`, {
      headers: authHeaders(),
    }),
  getInfluencerAnalytics: () =>
    fetcher<{ summary: any; influencers: any[]; recentOrders: any[] }>('/promos/influencers/analytics', {
      headers: authHeaders(),
    }),

  // Bundles & Volume Discounts
  getBundles: () => fetcher<{ bundles: any[]; total: number }>('/bundles'),
  getAllBundles: () => fetcher<{ bundles: any[]; total: number }>('/bundles/all', { headers: authHeaders() }),
  getBundle: (id: string) => fetcher<any>(`/bundles/${id}`, { headers: authHeaders() }),
  createBundle: (data: any) =>
    fetcher<{ message: string; bundle: any }>('/bundles', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
  updateBundle: (id: string, data: any) =>
    fetcher<{ message: string; bundle: any }>(`/bundles/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
  deleteBundle: (id: string) =>
    fetcher<{ message: string }>(`/bundles/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),
  resetBundles: () =>
    fetcher<{ message: string; bundles: any[] }>('/bundles/reset', {
      method: 'POST',
      headers: authHeaders(),
    }),

  // Reviews & Customer Ratings Management
  getReviews: (params?: {
    status?: string;
    category?: string;
    rating?: number;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.category && params.category !== 'all') qs.set('category', params.category);
    if (params?.rating) qs.set('rating', String(params.rating));
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.sort) qs.set('sort', params.sort);
    const queryString = qs.toString() ? `?${qs.toString()}` : '';
    return fetcher<{
      reviews: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      summary: any;
    }>(`/reviews/admin${queryString}`, { headers: authHeaders() });
  },
  getRatingSummary: (params?: { category?: string; productSlug?: string }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.productSlug) qs.set('productSlug', params.productSlug);
    const queryString = qs.toString() ? `?${qs.toString()}` : '';
    return fetcher<any>(`/reviews/summary${queryString}`, { headers: authHeaders() });
  },
  updateReviewStatus: (id: string, status: string, adminNotes?: string) =>
    fetcher<{ message: string; review: any }>(`/reviews/admin/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status, adminNotes }),
    }),
  deleteReview: (id: string) =>
    fetcher<{ message: string }>(`/reviews/admin/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),
  seedReviews: (force = true) =>
    fetcher<{ message: string; count: number }>(`/reviews/admin/seed`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ force }),
    }),

  // Health
  health: () => fetcher<{ status: string }>('/health'),
};

export { ApiError };
export default adminApi;
