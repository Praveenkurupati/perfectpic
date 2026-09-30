"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, MoreVertical, Download } from "lucide-react";
import { recentOrders } from "@/lib/mock-data";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const tabs = ["All", "Payment Pending", "Confirmed", "In Print", "Dispatched", "Delivered", "Returned"];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [orders, setOrders] = useState<any[]>(recentOrders);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    adminApi.getOrders()
      .then(res => {
        if (res && res.orders && res.orders.length > 0) {
          const apiOrders = res.orders.map((o: any) => {
            const items = Array.isArray(o.items) ? o.items : [];
            const hasKeepsakeBox = Boolean(
              o.packaging?.keepsakeBox ||
              o.accessories?.keepsakeBox ||
              items.some((i: any) => i.id === 'acc-keepsake-box' || i.id === 'keepsakeBox' || /keepsake|velvet box/i.test(i.title || ''))
            );
            const hasGiftWrap = Boolean(
              o.packaging?.giftWrap ||
              o.accessories?.giftWrap ||
              o.isGift ||
              items.some((i: any) => i.id === 'acc-gift-wrap' || i.id === 'giftWrap' || /ribbon|gift wrap|calligraphy/i.test(i.title || ''))
            );
            const hasUvGlaze = Boolean(
              o.packaging?.uvGlaze ||
              o.accessories?.uvGlaze ||
              items.some((i: any) => i.id === 'acc-uv-glaze' || i.id === 'uvGlaze' || /uv glaze|anti-scratch/i.test(i.title || ''))
            );
            const hasMiniPolaroids = Boolean(
              o.packaging?.miniPolaroids ||
              o.accessories?.miniPolaroids ||
              items.some((i: any) => i.id === 'acc-mini-prints' || i.id === 'miniPolaroids' || /polaroid/i.test(i.title || ''))
            );

            const packagingBadges: string[] = [];
            if (hasKeepsakeBox) packagingBadges.push('🎁 Velvet Box');
            if (hasGiftWrap) packagingBadges.push('🎀 Ribbon Wrap');
            if (hasUvGlaze) packagingBadges.push('🛡️ UV Glaze');
            if (hasMiniPolaroids) packagingBadges.push('📷 Polaroids');

            return {
              id: o.orderNumber || o.id,
              customer: o.title || 'Guest Order',
              customerName: o.customerName || 'Valued Customer',
              date: (o.createdAt || o.date) ? new Date(o.createdAt || o.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '26 Sep 2026',
              pages: o.pageCount || 40,
              size: o.dimensions || '8.25" × 8.25"',
              status: o.status || 'confirmed',
              amount: (o.amount || o.total || 1999).toLocaleString('en-IN'),
              pdfUrl: o.pdfUrl,
              packagingBadges,
              isGift: Boolean(o.isGift || hasGiftWrap),
            };
          });
          setOrders(apiOrders);
        }
      })
      .catch(err => {
        console.warn("Using offline mock orders:", err);
      });
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === "All" || 
      (activeTab === "Confirmed" && (order.status === 'confirmed' || order.status === 'production')) ||
      (activeTab === "In Print" && (order.status === 'printing' || order.status === 'production')) ||
      (activeTab === "Dispatched" && order.status === 'dispatched') ||
      (activeTab === "Delivered" && order.status === 'delivered') ||
      (activeTab === "Payment Pending" && order.status === 'pending');

    const matchesSearch = !searchQuery || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold text-noir-950">Orders Management</h1>
          <p className="text-sm text-noir-500 mt-1">View and manage all customer orders across India.</p>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200">
        {/* Toolbar */}
        <div className="p-4 border-b border-cream-200 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex space-x-1 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-sm text-sm font-medium transition-colors",
                  activeTab === tab 
                    ? "bg-noir-950 text-cream-50" 
                    : "text-noir-600 hover:bg-cream-100 hover:text-noir-900"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="relative min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-noir-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, Name..." 
              className="w-full pl-9 pr-4 py-2 bg-cream-50 border border-cream-300 rounded-sm text-sm focus:outline-none focus:border-noir-400 focus:ring-1 focus:ring-noir-400 transition-shadow"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-50/50">
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider">Order ID</th>
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider">Customer / Book</th>
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider">Spec</th>
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider">Amount</th>
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-noir-500">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-cream-50/50 transition-colors group">
                    <td className="p-4">
                      <Link href={`/orders/${order.id}`} className="font-medium text-sm text-noir-950 hover:underline">
                        {order.id}
                      </Link>
                    </td>
                    <td className="p-4 text-sm text-noir-800 font-medium">
                      <div className="flex flex-col">
                        <span>{order.customer}</span>
                        {order.packagingBadges && order.packagingBadges.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {order.packagingBadges.map((badge: string, bIdx: number) => (
                              <span 
                                key={bIdx} 
                                className="text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/80 px-1.5 py-0.5 rounded-xs"
                              >
                                {badge}
                              </span>
                            ))}
                            {order.isGift && (
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-xs">
                                🎁 Gift
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-noir-500 whitespace-nowrap">{order.date}</td>
                    <td className="p-4 text-sm text-noir-600">
                      {order.pages}p, {order.size}
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm inline-block font-medium",
                        order.status === 'confirmed' ? "bg-blue-100 text-blue-700" :
                        order.status === 'pending' ? "bg-amber-100 text-amber-700" :
                        order.status === 'printing' || order.status === 'production' ? "bg-purple-100 text-purple-700" :
                        order.status === 'dispatched' ? "bg-indigo-100 text-indigo-700" :
                        order.status === 'delivered' ? "bg-green-100 text-green-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium tabular-nums text-noir-900">₹{order.amount}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {order.pdfUrl && (
                          <a
                            href={order.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            download={`PerfectPic-Print-${order.id}.pdf`}
                            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-sm flex items-center gap-1 shadow-xs"
                            title="Download Print PDF directly from S3"
                          >
                            <Download className="w-3 h-3 text-emerald-700" />
                            <span>PDF</span>
                          </a>
                        )}
                        <Link 
                          href={`/orders/${order.id}`}
                          className="text-xs font-medium text-noir-600 hover:text-noir-950 px-2 py-1 bg-cream-100 rounded-sm"
                        >
                          View
                        </Link>
                        <button className="text-noir-400 hover:text-noir-950 p-1">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-cream-200 flex items-center justify-between text-sm text-noir-500">
          <div>Showing {filteredOrders.length} results</div>
          <div className="flex space-x-1">
            <button className="p-1 rounded-sm hover:bg-cream-100 border border-transparent disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <button className="px-3 py-1 rounded-sm bg-noir-950 text-cream-50 font-medium">1</button>
            <button className="p-1 rounded-sm hover:bg-cream-100 border border-transparent"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
