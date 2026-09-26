"use client";

import { ShoppingCart, IndianRupee, Printer, Ticket } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { recentOrders, revenueData } from "@/lib/mock-data";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardOverview() {
  const stats = [
    { label: "Total Orders", value: "1,247", icon: ShoppingCart, trend: "+12%", trendUp: true },
    { label: "Revenue", value: "₹18,64,500", icon: IndianRupee, trend: "+8%", trendUp: true },
    { label: "Pending Prints", value: "23", icon: Printer, trend: "-5%", trendUp: true }, // less pending is good
    { label: "Active Tickets", value: "8", icon: Ticket, trend: "+2", trendUp: false },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold text-noir-950">Dashboard Overview</h1>
          <p className="text-sm text-noir-500 mt-1">Welcome back. Here is what is happening today.</p>
        </div>
        <div className="space-x-3">
          <button className="px-4 py-2 bg-cream-100 text-noir-900 rounded-sm text-sm font-medium hover:bg-cream-200 transition-colors border border-cream-300">
            Generate Reports
          </button>
          <button className="px-4 py-2 bg-noir-950 text-cream-50 rounded-sm text-sm font-medium hover:bg-noir-900 transition-colors">
            Create Manual Order
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-md shadow-luxury-sm border border-cream-200 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-cream-100 rounded-sm text-noir-900">
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                stat.trendUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {stat.trend}
              </span>
            </div>
            <h3 className="text-3xl font-semibold tabular-nums text-noir-950">{stat.value}</h3>
            <p className="text-sm text-noir-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-md shadow-luxury-sm border border-cream-200">
          <h2 className="text-lg font-semibold text-noir-950 mb-6">Revenue Over Time</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C5A880" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C5A880" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #DFD7C7', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => [`₹${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#C5A880" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-md shadow-luxury-sm border border-cream-200 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-noir-950">Recent Orders</h2>
            <Link href="/orders" className="text-sm text-foil-gold hover:text-foil-gold/80 font-medium">View All</Link>
          </div>
          <div className="flex-1 flex flex-col space-y-4 overflow-y-auto">
            {recentOrders.slice(0, 5).map(order => (
              <div key={order.id} className="flex justify-between items-center py-2 border-b border-cream-100 last:border-0">
                <div>
                  <Link href={`/orders/${order.id}`} className="font-medium text-sm text-noir-900 hover:underline">
                    {order.id}
                  </Link>
                  <p className="text-xs text-noir-500">{order.customer}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-noir-900">₹{order.amount}</p>
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm inline-block mt-1",
                    order.status === 'confirmed' ? "bg-blue-100 text-blue-700" :
                    order.status === 'pending' ? "bg-amber-100 text-amber-700" :
                    order.status === 'printing' ? "bg-purple-100 text-purple-700" :
                    order.status === 'dispatched' ? "bg-indigo-100 text-indigo-700" :
                    order.status === 'delivered' ? "bg-green-100 text-green-700" :
                    "bg-red-100 text-red-700"
                  )}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
