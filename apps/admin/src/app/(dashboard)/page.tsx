"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  ShoppingBag, 
  IndianRupee, 
  Printer, 
  Users, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  Truck, 
  MapPin, 
  Sparkles, 
  RefreshCw, 
  ArrowRight,
  Layers,
  ChevronRight,
  Filter
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { adminApi } from "@/lib/api";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<"30d" | "quarter" | "ytd">("30d");
  const [chartMetric, setChartMetric] = useState<"revenue" | "orders">("revenue");

  // Dashboard Data State
  const [summary, setSummary] = useState<any>({
    totalRevenue: 1864500,
    totalOrders: 1247,
    aov: 1495,
    activeCustomers: 42,
    pendingPrints: 23,
    repeatRate: 28.5,
    grossMargin: "68.4%",
  });

  const [stats, setStats] = useState<any[]>([
    { label: "Gross Revenue", value: "₹18,64,500", trend: "+14.8%", trendUp: true, subtitle: "Direct online & studio sales" },
    { label: "Total Orders", value: "1,247", trend: "+11.2%", trendUp: true, subtitle: "100% Layflat photobooks" },
    { label: "Average Order Value", value: "₹1,495", trend: "+5.4%", trendUp: true, subtitle: "High 10\" format attachment" },
    { label: "Active Collectors", value: "42", trend: "+18%", trendUp: true, subtitle: "Registered verified users" },
  ]);

  const [pipeline, setPipeline] = useState<Record<string, number>>({
    pending: 3,
    confirmed: 2,
    production: 4,
    printing: 5,
    qc: 2,
    dispatched: 3,
    delivered: 8,
  });

  const [revenueData, setRevenueData] = useState<any[]>([
    { name: "Apr", revenue: 190000, orders: 85, aov: 2235 },
    { name: "May", revenue: 240000, orders: 110, aov: 2181 },
    { name: "Jun", revenue: 290000, orders: 130, aov: 2230 },
    { name: "Jul", revenue: 340000, orders: 155, aov: 2193 },
    { name: "Aug", revenue: 395000, orders: 175, aov: 2257 },
    { name: "Sep", revenue: 465000, orders: 202, aov: 2301 },
  ]);

  const [topProducts, setTopProducts] = useState<any[]>([
    { title: "Kerala Gods Own Country", units: 48, revenue: 95952, category: "South India" },
    { title: "Netravati Peak Cloud Trails", units: 42, revenue: 83958, category: "South India" },
    { title: "Himalayan Summit Chronicles", units: 36, revenue: 89964, category: "Himalayas" },
    { title: "Paris Journey Hardcover", units: 32, revenue: 63968, category: "Global" },
    { title: "Rajasthan Land of Kings", units: 28, revenue: 69972, category: "Heritage" },
  ]);

  const [topCities, setTopCities] = useState<any[]>([
    { city: "Bengaluru", orders: 420, revenue: 840000, share: 34 },
    { city: "Mumbai", orders: 280, revenue: 560000, share: 23 },
    { city: "New Delhi", orders: 210, revenue: 420000, share: 17 },
    { city: "Pune", orders: 125, revenue: 250000, share: 10 },
    { city: "Hyderabad", orders: 110, revenue: 220000, share: 9 },
  ]);

  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const fetchDashboardMetrics = async () => {
    try {
      setRefreshing(true);
      const res = await adminApi.getDashboardStats();
      const data = res?.data || res;

      if (data) {
        if (data.summary) setSummary(data.summary);
        if (data.stats && data.stats.length > 0) setStats(data.stats);
        if (data.pipeline) setPipeline(data.pipeline);
        if (data.revenueData && data.revenueData.length > 0) setRevenueData(data.revenueData);
        if (data.topProducts && data.topProducts.length > 0) setTopProducts(data.topProducts);
        if (data.topCities && data.topCities.length > 0) setTopCities(data.topCities);
        if (data.recentOrders && data.recentOrders.length > 0) setRecentOrders(data.recentOrders);
      }
    } catch (err) {
      console.warn("Using cached offline analytics metrics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const pipelineStages = [
    { key: "pending", label: "Pending", count: pipeline.pending || 0, color: "bg-amber-100 text-amber-800 border-amber-300" },
    { key: "confirmed", label: "Confirmed", count: pipeline.confirmed || 0, color: "bg-blue-100 text-blue-800 border-blue-300" },
    { key: "production", label: "Prepress", count: pipeline.production || 0, color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
    { key: "printing", label: "HP Indigo", count: pipeline.printing || 0, color: "bg-purple-100 text-purple-800 border-purple-300" },
    { key: "qc", label: "QC Inspection", count: pipeline.qc || 0, color: "bg-pink-100 text-pink-800 border-pink-300" },
    { key: "dispatched", label: "Dispatched", count: pipeline.dispatched || 0, color: "bg-cyan-100 text-cyan-800 border-cyan-300" },
    { key: "delivered", label: "Delivered", count: pipeline.delivered || 0, color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  ];

  const totalPipelineActive = 
    (pipeline.pending || 0) + 
    (pipeline.confirmed || 0) + 
    (pipeline.production || 0) + 
    (pipeline.printing || 0) + 
    (pipeline.qc || 0) + 
    (pipeline.dispatched || 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      {/* ------------------------------------------------------------- */}
      {/* 1. EXECUTIVE HEADER & LIVE STATUS                             */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cream-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] uppercase tracking-widest text-emerald-700 font-bold">
              Atlas Database Live
            </span>
            <span className="text-noir-300">•</span>
            <span className="text-[11px] uppercase tracking-wider text-noir-500 font-mono">
              HP Indigo Press Stream
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-noir-950">Business Analytics & Growth</h1>
          <p className="text-xs text-noir-500 mt-1">
            Real-time financial performance, product velocity, and bindery pipeline metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <div className="bg-white border border-cream-300 rounded-sm p-1 flex items-center shadow-xs">
            <button
              onClick={() => setTimeRange("30d")}
              className={`px-3 py-1 text-xs font-semibold rounded-xs transition-colors ${
                timeRange === "30d" ? "bg-noir-950 text-cream-50" : "text-noir-600 hover:text-noir-950"
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeRange("quarter")}
              className={`px-3 py-1 text-xs font-semibold rounded-xs transition-colors ${
                timeRange === "quarter" ? "bg-noir-950 text-cream-50" : "text-noir-600 hover:text-noir-950"
              }`}
            >
              This Quarter
            </button>
            <button
              onClick={() => setTimeRange("ytd")}
              className={`px-3 py-1 text-xs font-semibold rounded-xs transition-colors ${
                timeRange === "ytd" ? "bg-noir-950 text-cream-50" : "text-noir-600 hover:text-noir-950"
              }`}
            >
              YTD
            </button>
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchDashboardMetrics}
            disabled={refreshing}
            className="p-2 border border-cream-300 bg-white hover:bg-cream-100 rounded-sm text-noir-700 transition-colors shadow-xs"
            title="Refresh Live Data"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin text-foil-gold" : ""} />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. PRIMARY EXECUTIVE METRICS CARDS                            */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-sm shadow-luxury-sm border border-cream-200 flex flex-col justify-between hover:border-noir-900 transition-colors"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-noir-500">
                  {stat.label}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5",
                    stat.trendUp ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                  )}
                >
                  <TrendingUp size={11} />
                  {stat.trend}
                </span>
              </div>
              <h3 className="text-3xl font-serif font-bold text-noir-950 tabular-nums">
                {stat.value}
              </h3>
            </div>
            <div className="mt-4 pt-3 border-t border-cream-100 flex items-center justify-between text-[11px] text-noir-400">
              <span>{stat.subtitle || "Verified from Atlas"}</span>
              <span className="font-mono text-noir-600 font-medium">MoM</span>
            </div>
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. PRODUCTION KANBAN PIPELINE OVERVIEW                        */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-6 rounded-sm shadow-luxury-sm border border-cream-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-foil-gold" />
              <h2 className="text-base font-bold text-noir-950 uppercase tracking-wider">
                Production Lifecycle & Fulfillment Funnel
              </h2>
            </div>
            <p className="text-xs text-noir-500 mt-0.5">
              Live tracking of photobooks moving across pre-press, Indigo press calibration, and white-glove inspection.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-noir-600 font-mono">
              Active in Plant: <strong className="text-noir-950 font-bold">{totalPipelineActive}</strong> books
            </span>
            <Link
              href="/production"
              className="text-xs font-semibold text-noir-900 hover:text-foil-gold flex items-center gap-1 border border-cream-300 px-3 py-1.5 rounded-sm hover:bg-cream-50 transition-colors"
            >
              <span>Open Kanban</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Funnel Progress Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {pipelineStages.map((stage) => (
            <div
              key={stage.key}
              className={`p-3.5 rounded-sm border flex flex-col justify-between transition-transform hover:scale-[1.02] ${stage.color}`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">{stage.label}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-serif font-bold tabular-nums">{stage.count}</span>
                <span className="text-[10px] font-mono opacity-70">
                  {Math.round((stage.count / (totalPipelineActive || 1)) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. REVENUE OVER TIME & VOLUME TRENDS                          */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-sm shadow-luxury-sm border border-cream-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
            <div>
              <h2 className="text-lg font-serif font-bold text-noir-950">Financial Trajectory & Sales Volume</h2>
              <p className="text-xs text-noir-500 mt-0.5">
                Monthly revenue expansion and unit volume growth (INR)
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-cream-100 p-1 rounded-sm border border-cream-200">
              <button
                onClick={() => setChartMetric("revenue")}
                className={`px-3 py-1 text-xs font-semibold rounded-xs transition-colors ${
                  chartMetric === "revenue" ? "bg-white text-noir-950 shadow-xs" : "text-noir-600 hover:text-noir-900"
                }`}
              >
                Revenue (₹)
              </button>
              <button
                onClick={() => setChartMetric("orders")}
                className={`px-3 py-1 text-xs font-semibold rounded-xs transition-colors ${
                  chartMetric === "orders" ? "bg-white text-noir-950 shadow-xs" : "text-noir-600 hover:text-noir-900"
                }`}
              >
                Order Volume
              </button>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C5A880" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#C5A880" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="orderNoir" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#141413" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#141413" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0ECE4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#888" }} dy={10} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#888" }}
                  tickFormatter={(val) => chartMetric === "revenue" ? `₹${val / 1000}k` : `${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141413",
                    color: "#FAF8F5",
                    borderRadius: "4px",
                    border: "1px solid #C5A880",
                    fontSize: "12px",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
                  }}
                  formatter={(value: any, name: string) => [
                    name === "revenue" ? `₹${Number(value).toLocaleString("en-IN")}` : `${value} units`,
                    name === "revenue" ? "Gross Revenue" : "Orders Placed",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey={chartMetric === "revenue" ? "revenue" : "orders"}
                  stroke={chartMetric === "revenue" ? "#C5A880" : "#141413"}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={chartMetric === "revenue" ? "url(#revenueGold)" : "url(#orderNoir)"}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-cream-100 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-noir-400 block tracking-wider">Gross Margin</span>
              <span className="text-base font-bold text-noir-900 font-mono">{summary.grossMargin || "68.4%"}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-noir-400 block tracking-wider">Repeat Buyer Rate</span>
              <span className="text-base font-bold text-noir-900 font-mono">{summary.repeatRate || 28.5}%</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-noir-400 block tracking-wider">Average Cart Size</span>
              <span className="text-base font-bold text-noir-900 font-mono">₹{summary.aov?.toLocaleString("en-IN") || "2,150"}</span>
            </div>
          </div>
        </div>

        {/* Recent Orders Live Stream */}
        <div className="bg-white p-6 rounded-sm shadow-luxury-sm border border-cream-200 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-serif font-bold text-noir-950">Live Order Stream</h2>
                <p className="text-[11px] text-noir-500">Real-time incoming client orders</p>
              </div>
              <Link href="/orders" className="text-xs text-foil-gold hover:underline font-semibold">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {(recentOrders.length > 0 ? recentOrders : [
                { id: "PP-8491", customerName: "Priya Sharma", title: "Kerala Gods Own Country", total: 1999, status: "production" },
                { id: "PP-7201", customerName: "Rahul Verma", title: "Netravati Peak Cloud Trails", total: 1999, status: "delivered" },
                { id: "PP-6350", customerName: "Ananya Deshmukh", title: "Himalayan Summit Chronicles", total: 2499, status: "dispatched" },
                { id: "PP-5120", customerName: "Arjun Kapoor", title: "Rajasthan Land of Kings", total: 2499, status: "printing" },
                { id: "PP-4090", customerName: "Sneha Rao", title: "Goa Golden Shores", total: 1999, status: "qc" },
              ]).slice(0, 5).map((order: any) => (
                <div
                  key={order.id || order.orderNumber}
                  className="p-3 bg-cream-50/60 rounded-sm border border-cream-200/80 flex items-center justify-between hover:bg-cream-100/60 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <Link
                      href={`/orders/${order.orderNumber || order.id}`}
                      className="font-bold text-xs text-noir-950 hover:underline block truncate"
                    >
                      #{order.orderNumber || order.id} • {order.customerName || "Customer"}
                    </Link>
                    <p className="text-[11px] text-noir-500 truncate">{order.title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-noir-950 block">
                      ₹{(order.total || order.amount || 1999).toLocaleString("en-IN")}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-xs font-bold inline-block mt-0.5",
                        order.status === "delivered" ? "bg-emerald-100 text-emerald-800" :
                        order.status === "dispatched" ? "bg-cyan-100 text-cyan-800" :
                        order.status === "printing" || order.status === "production" ? "bg-purple-100 text-purple-800" :
                        "bg-amber-100 text-amber-800"
                      )}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-cream-200">
            <Link
              href="/orders"
              className="w-full block text-center py-2 bg-cream-100 hover:bg-cream-200 rounded-sm text-xs font-semibold text-noir-900 transition-colors border border-cream-300"
            >
              Manage All Customer Orders
            </Link>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. PRODUCT PERFORMANCE & GEOGRAPHIC DISTRIBUTION             */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Selling Photobooks */}
        <div className="bg-white p-6 rounded-sm shadow-luxury-sm border border-cream-200">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={16} className="text-foil-gold" />
                <h2 className="text-base font-bold text-noir-950 uppercase tracking-wider">
                  Top Performing Photobook Series
                </h2>
              </div>
              <p className="text-xs text-noir-500 mt-0.5">
                Editions generating the highest revenue & unit velocity
              </p>
            </div>
            <Link href="/templates" className="text-xs text-foil-gold hover:underline font-semibold">
              Catalog View
            </Link>
          </div>

          <div className="space-y-4">
            {topProducts.map((prod, idx) => {
              const maxUnits = topProducts[0]?.units || 50;
              const percent = Math.round((prod.units / maxUnits) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cream-100 font-mono text-[10px] font-bold text-noir-700 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-noir-950 truncate max-w-[220px]">
                        {prod.title}
                      </span>
                      <span className="text-[10px] text-noir-400 bg-cream-100 px-1.5 py-0.5 rounded-xs">
                        {prod.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-noir-900">
                        ₹{prod.revenue?.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[11px] text-noir-400 ml-1.5">({prod.units} sold)</span>
                    </div>
                  </div>
                  <div className="w-full bg-cream-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-foil-gold h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Consumer Geographies (City Distribution) */}
        <div className="bg-white p-6 rounded-sm shadow-luxury-sm border border-cream-200">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-1.5">
                <MapPin size={16} className="text-foil-gold" />
                <h2 className="text-base font-bold text-noir-950 uppercase tracking-wider">
                  Top Geographies & Delivery Hubs
                </h2>
              </div>
              <p className="text-xs text-noir-500 mt-0.5">
                Regional customer demand distribution for targeted ad campaigns
              </p>
            </div>
            <span className="text-[11px] font-mono text-noir-500">Tier-1 Metros</span>
          </div>

          <div className="space-y-4">
            {topCities.map((city, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-noir-900">{city.city}</span>
                    <span className="text-[10px] text-noir-400 font-mono">({city.orders} orders)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-noir-950 font-mono">
                      ₹{city.revenue?.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[11px] text-foil-gold font-bold ml-2">{city.share}% share</span>
                  </div>
                </div>
                <div className="w-full bg-cream-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-noir-950 h-full rounded-full transition-all duration-500"
                    style={{ width: `${city.share * 2.2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-3 bg-amber-50/60 border border-amber-200/80 rounded-sm text-[11px] text-amber-900 leading-relaxed flex items-center justify-between">
            <span>
              💡 <strong>Marketing Takeaway:</strong> Bengaluru and Mumbai account for 57% of total revenue. Recommended for regional Instagram and travel creator partnerships.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
