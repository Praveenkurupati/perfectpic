"use client";

import { customers } from "@/lib/mock-data";
import { Search, Mail, Phone } from "lucide-react";

export default function CustomersPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold text-noir-950">Customers</h1>
          <p className="text-sm text-noir-500 mt-1">Manage customer profiles and order history.</p>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200">
        <div className="p-4 border-b border-cream-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-noir-400" />
            <input 
              type="text" 
              placeholder="Search by name, email or phone..." 
              className="w-full pl-9 pr-4 py-2 bg-cream-50 border border-cream-300 rounded-sm text-sm focus:outline-none focus:border-noir-400 focus:ring-1 focus:ring-noir-400 transition-shadow"
            />
          </div>
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
              {customers.map((c) => (
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
                  <td className="p-4 text-sm text-noir-600">{c.joinedDate}</td>
                  <td className="p-4 text-sm font-medium tabular-nums text-noir-900 text-right">{c.ordersCount}</td>
                  <td className="p-4 text-sm font-medium tabular-nums text-noir-900 text-right">₹{c.totalSpent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
