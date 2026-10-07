"use client";

import { useState, useEffect } from "react";
import { customers as fallbackCustomers } from "@/lib/mock-data";
import { adminApi } from "@/lib/api";
import { Search, Mail, Phone, Loader2 } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";

export default function CustomersPage() {
  const [customerList, setCustomerList] = useState<any[]>(fallbackCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(fallbackCustomers.length);
  const [totalPages, setTotalPages] = useState(Math.ceil(fallbackCustomers.length / 10));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    adminApi.getCustomers({ search: searchTerm, page: currentPage, limit: pageSize })
      .then((res) => {
        if (isMounted && res && res.customers) {
          setCustomerList(res.customers);
          if (res.total !== undefined) {
            setTotalItems(res.total);
            setTotalPages(res.totalPages || Math.ceil(res.total / pageSize));
          }
        }
      })
      .catch((err) => {
        console.warn("Falling back to local customer list:", err);
        const filtered = fallbackCustomers.filter((c) =>
          !searchTerm ||
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone.includes(searchTerm)
        );
        setTotalItems(filtered.length);
        setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));
        const start = (currentPage - 1) * pageSize;
        setCustomerList(filtered.slice(start, start + pageSize));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [searchTerm, currentPage, pageSize]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold text-noir-950">Customers</h1>
          <p className="text-sm text-noir-500 mt-1">Manage customer profiles and order history.</p>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200">
        <div className="p-4 border-b border-cream-200 flex justify-between items-center">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-noir-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email or phone..." 
              className="w-full pl-9 pr-4 py-2 bg-cream-50 border border-cream-300 rounded-sm text-sm focus:outline-none focus:border-noir-400 focus:ring-1 focus:ring-noir-400 transition-shadow"
            />
          </div>
          {isLoading && (
            <div className="flex items-center text-xs text-noir-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              Searching...
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-50/50">
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider">Customer</th>
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider">Contact</th>
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider">Joined</th>
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider text-right">Orders</th>
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {customerList.map((c) => (
                <tr key={c.id} className="hover:bg-cream-50/50 transition-colors cursor-pointer">
                  <td className="p-4">
                    <p className="font-medium text-sm text-noir-950">{c.name}</p>
                    <p className="text-xs text-noir-500">{c.id}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center text-sm text-noir-600 mb-1">
                      <Mail className="w-3.5 h-3.5 mr-2 opacity-70" /> {c.email}
                    </div>
                    <div className="flex items-center text-sm text-noir-600">
                      <Phone className="w-3.5 h-3.5 mr-2 opacity-70" /> {c.phone}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-noir-600">{c.joinedDate || c.createdAt?.substring(0, 10) || "Recent"}</td>
                  <td className="p-4 text-sm font-medium tabular-nums text-noir-900 text-right">{c.ordersCount || 1}</td>
                  <td className="p-4 text-sm font-medium tabular-nums text-noir-900 text-right">
                    ₹{typeof c.totalSpent === 'number' ? c.totalSpent.toLocaleString('en-IN') : c.totalSpent}
                  </td>
                </tr>
              ))}
              {customerList.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-noir-500">
                    No customers found matching &ldquo;{searchTerm}&rdquo;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Enterprise Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50]}
          itemLabel="customers"
        />
      </div>
    </div>
  );
}
