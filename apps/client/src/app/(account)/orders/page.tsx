'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fallbackOrders = [
    { id: 'WB-8491', title: 'Our Wedding', createdAt: '2026-09-26T00:00:00.000Z', total: 3099, status: 'Production', coverUrl: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=150&auto=format&fit=crop' },
    { id: 'WB-7201', title: 'Bali Trip 2025', createdAt: '2026-01-14T00:00:00.000Z', total: 2499, status: 'Delivered', coverUrl: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=150&auto=format&fit=crop' },
  ];

  useEffect(() => {
    api.getOrders()
      .then(res => setOrders(res.orders || []))
      .catch(err => {
        console.error("Failed to fetch orders, using mock data", err);
        setOrders(fallbackOrders);
      })
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    if (status.toLowerCase() === 'delivered') return 'text-green-600 bg-green-50 border-green-200';
    if (status.toLowerCase() === 'production') return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-cream-200">
        <h2 className="font-serif text-2xl font-semibold text-noir-900">Your Orders</h2>
        <span className="text-xs text-noir-500 uppercase tracking-wider">{orders.length} order(s) found</span>
      </div>

      {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white p-6 rounded-sm shadow-sm border border-cream-200 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-pulse">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-cream-200 rounded-sm shrink-0"></div>
                  <div className="space-y-2">
                    <div className="h-6 bg-cream-200 w-32 rounded-sm"></div>
                    <div className="h-4 bg-cream-200 w-48 rounded-sm"></div>
                    <div className="h-5 bg-cream-200 w-20 rounded-sm"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white p-12 text-center border border-cream-200 rounded-sm">
                <p className="text-noir-500 mb-4">You have no orders yet.</p>
                <a href="/configure" className="text-sm font-medium border border-noir-900 px-4 py-2 rounded-sm hover:bg-cream-50">Start Creating</a>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-sm shadow-sm border border-cream-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-cream-100 rounded-sm overflow-hidden shrink-0">
                      <img src={order.coverUrl || order.thumbnail || "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=150&auto=format&fit=crop"} alt="Cover" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl mb-1">{order.title}</h3>
                      <p className="text-sm text-noir-500 mb-2">Order #{order.id} • {formatDate(order.createdAt || order.date)}</p>
                      <span className={`text-xs px-2 py-1 rounded-sm border ${getStatusColor(order.status)} font-medium tracking-wider uppercase`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-cream-200">
                    <span className="font-serif text-xl">₹{(order.total || order.amount)?.toLocaleString('en-IN')}</span>
                    <button className="text-sm font-medium border border-noir-900 px-4 py-2 rounded-sm hover:bg-cream-50 transition-colors">
                      {order.status?.toLowerCase() === 'delivered' ? 'Order Again' : 'Track Order'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
    </div>
  );
}
