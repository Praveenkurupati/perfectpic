"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileCheck2, 
  Calendar, 
  Printer, 
  Truck, 
  Clock, 
  IndianRupee, 
  CheckCircle2, 
  AlertCircle, 
  PrinterCheck, 
  ShieldCheck, 
  Sparkles, 
  Share2, 
  Printer as PrintIcon, 
  RefreshCw,
  ArrowRight,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ActionItem {
  id: string;
  priority: "P1" | "P2" | "P3";
  task: string;
  owner: string;
  status: "pending" | "in_progress" | "completed";
}

export default function DailySummaryPage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionItems, setActionItems] = useState<ActionItem[]>([
    {
      id: "act-1",
      priority: "P1",
      task: "Expedite Order #PP-8491: Complete layflat thermal bindery run before 02:00 PM BlueDart cutoff.",
      owner: "Production Lead",
      status: "in_progress",
    },
    {
      id: "act-2",
      priority: "P2",
      task: "Resolve address clarification on Order #PP-8491 (Aarav Mehta - Bandra, Mumbai).",
      owner: "Customer Concierge",
      status: "pending",
    },
    {
      id: "act-3",
      priority: "P3",
      task: "Review Kyoto Zen Temples conversion rate (High views, 6.5% conversion — test bundle offer).",
      owner: "Product Manager",
      status: "pending",
    },
  ]);

  const fetchDailySummary = async () => {
    try {
      const data = await adminApi.getDailySummary();
      setSummaryData(data);
    } catch (e) {
      console.warn("Using fallback daily summary", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDailySummary();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDailySummary();
  };

  const toggleTaskStatus = (id: string) => {
    setActionItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextStatus =
          item.status === "pending"
            ? "in_progress"
            : item.status === "in_progress"
            ? "completed"
            : "pending";
        return { ...item, status: nextStatus };
      })
    );
  };

  const metrics = summaryData?.metrics || {
    todayRevenue: 24990,
    todayOrders: 11,
    productionCompleted: 9,
    shippedToday: 7,
    slaCompliance: 94.2,
    grossMargin: 54.2,
  };

  const highlights = summaryData?.highlights || [
    "Strong weekend pickup: 11 new custom photobook projects submitted for print.",
    "Average production cycle time improved to 18.2 hours (24% faster than weekly target).",
    "HP Indigo 12K digital press uptime at 99.4% with zero color calibration errors.",
  ];

  const currentDateFormatted =
    summaryData?.date ||
    new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 print:p-0 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-cream-200 print:pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-foil-gold font-semibold">
              Executive Morning Briefing
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Operations Active
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-noir-900 tracking-tight">
            Daily Business Summary
          </h1>
          <p className="text-sm text-noir-600 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-foil-gold" />
            <span className="font-semibold text-noir-900">{currentDateFormatted}</span>
            <span className="text-noir-400">•</span>
            <span>{summaryData?.headline || "Operations Running at Normal Capacity • 1 Priority SLA Order"}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-medium text-noir-800 bg-white border border-cream-300 rounded hover:bg-cream-50 transition-colors shadow-sm"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-foil-gold")} />
            Sync
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-medium text-noir-800 bg-white border border-cream-300 rounded hover:bg-cream-50 transition-colors shadow-sm"
          >
            <PrintIcon className="w-3.5 h-3.5" />
            Print Brief
          </button>
          <button
            onClick={() => alert("Summary briefing copied to clipboard for executive Slack channel.")}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-cream-50 bg-noir-950 rounded hover:bg-noir-900 transition-colors shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share Brief
          </button>
        </div>
      </div>

      {/* Today's Key Metrics Scorecard */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white border border-cream-200 rounded p-4 shadow-sm">
          <div className="text-[10px] font-mono uppercase tracking-wider text-noir-500 mb-1">
            Today's Inflow
          </div>
          <div className="font-serif text-xl font-bold text-noir-900">
            ₹{metrics.todayRevenue.toLocaleString("en-IN")}
          </div>
          <div className="text-[10px] font-mono text-emerald-600 mt-0.5">
            {metrics.todayOrders} new orders
          </div>
        </div>

        <div className="bg-white border border-cream-200 rounded p-4 shadow-sm">
          <div className="text-[10px] font-mono uppercase tracking-wider text-noir-500 mb-1">
            Books Printed
          </div>
          <div className="font-serif text-xl font-bold text-noir-900">
            {metrics.productionCompleted} Books
          </div>
          <div className="text-[10px] font-mono text-noir-600 mt-0.5">
            HP Indigo Press Run
          </div>
        </div>

        <div className="bg-white border border-cream-200 rounded p-4 shadow-sm">
          <div className="text-[10px] font-mono uppercase tracking-wider text-noir-500 mb-1">
            Courier Handover
          </div>
          <div className="font-serif text-xl font-bold text-noir-900">
            {metrics.shippedToday} Consignments
          </div>
          <div className="text-[10px] font-mono text-blue-600 mt-0.5">
            BlueDart Air Express
          </div>
        </div>

        <div className="bg-white border border-cream-200 rounded p-4 shadow-sm">
          <div className="text-[10px] font-mono uppercase tracking-wider text-noir-500 mb-1">
            SLA Compliance
          </div>
          <div className="font-serif text-xl font-bold text-noir-900">
            {metrics.slaCompliance}%
          </div>
          <div className="text-[10px] font-mono text-emerald-600 mt-0.5">
            Target &gt; 92.0%
          </div>
        </div>

        <div className="bg-white border border-cream-200 rounded p-4 shadow-sm">
          <div className="text-[10px] font-mono uppercase tracking-wider text-noir-500 mb-1">
            Gross Margin
          </div>
          <div className="font-serif text-xl font-bold text-noir-900">
            {metrics.grossMargin}%
          </div>
          <div className="text-[10px] font-mono text-emerald-600 mt-0.5">
            Above 50% target
          </div>
        </div>

        <div className="bg-white border border-cream-200 rounded p-4 shadow-sm">
          <div className="text-[10px] font-mono uppercase tracking-wider text-noir-500 mb-1">
            Concierge CSAT
          </div>
          <div className="font-serif text-xl font-bold text-noir-900">
            4.9 / 5.0
          </div>
          <div className="text-[10px] font-mono text-foil-gold mt-0.5">
            100% layflat rating
          </div>
        </div>
      </div>

      {/* Operational Highlights & Factory Wins */}
      <div className="bg-white border border-cream-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-foil-gold" />
          <h2 className="font-serif text-lg text-noir-900 font-semibold">
            Today's Operational Highlights & Factory Wins
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {highlights.map((h: string, idx: number) => (
            <div key={idx} className="p-4 rounded border border-cream-200 bg-cream-50/50">
              <span className="text-[10px] font-mono uppercase tracking-widest text-foil-gold font-bold">
                Highlight #{idx + 1}
              </span>
              <p className="text-xs text-noir-800 font-sans mt-2 leading-relaxed">
                {h}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Prioritized Daily Action Items */}
      <div className="bg-white border border-cream-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-lg text-noir-900 font-semibold">
              Prioritized Daily Action Items
            </h2>
            <p className="text-xs text-noir-600">
              Click status pill to toggle progress. Items must be closed before the 05:00 PM operational review.
            </p>
          </div>
          <span className="text-[11px] font-mono text-noir-500">
            {actionItems.filter((i) => i.status === "completed").length} / {actionItems.length} Resolved
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {actionItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "p-4 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                item.status === "completed"
                  ? "bg-cream-50 border-cream-200 opacity-70"
                  : item.priority === "P1"
                  ? "bg-rose-50/40 border-rose-200"
                  : "bg-white border-cream-200"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0",
                    item.priority === "P1" && "bg-rose-600 text-white",
                    item.priority === "P2" && "bg-amber-500 text-white",
                    item.priority === "P3" && "bg-blue-600 text-white"
                  )}
                >
                  {item.priority}
                </span>

                <div>
                  <p
                    className={cn(
                      "font-sans text-xs text-noir-900 font-medium",
                      item.status === "completed" && "line-through text-noir-500"
                    )}
                  >
                    {item.task}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-noir-500 font-mono">
                    <UserCheck className="w-3 h-3 text-noir-400" />
                    <span>Assigned: <strong className="text-noir-800">{item.owner}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => toggleTaskStatus(item.id)}
                  className={cn(
                    "px-3 py-1 rounded text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors",
                    item.status === "completed" && "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
                    item.status === "in_progress" && "bg-amber-100 text-amber-800 hover:bg-amber-200",
                    item.status === "pending" && "bg-cream-200 text-noir-800 hover:bg-cream-300"
                  )}
                >
                  {item.status.replace("_", " ")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Department Readiness Check */}
      <div className="bg-white border border-cream-200 rounded-lg p-6 shadow-sm">
        <h2 className="font-serif text-lg text-noir-900 font-semibold mb-1">
          Factory & Facility Readiness Status
        </h2>
        <p className="text-xs text-noir-600 mb-4">
          Hardware uptime, consumables inventory, and logistics pickup status.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-3.5 rounded border border-cream-200 bg-cream-50/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-sans font-semibold text-noir-900">HP Indigo 12K</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">Online • 99.4% Uptime</div>
            <div className="text-[10px] text-noir-500 mt-1">ElectroInk Levels: 82% Avg</div>
          </div>

          <div className="p-3.5 rounded border border-cream-200 bg-cream-50/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-sans font-semibold text-noir-900">Thermal Bindery</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">Operational • Table 1 & 2</div>
            <div className="text-[10px] text-noir-500 mt-1">12 books/hr throughput</div>
          </div>

          <div className="p-3.5 rounded border border-cream-200 bg-cream-50/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-sans font-semibold text-noir-900">BlueDart Dispatch</span>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <div className="text-[11px] text-blue-700 font-medium">Pickup: 03:00 PM IST</div>
            <div className="text-[10px] text-noir-500 mt-1">Staging Bay A prepared</div>
          </div>

          <div className="p-3.5 rounded border border-cream-200 bg-cream-50/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-sans font-semibold text-noir-900">Customer Concierge</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">Active • 0 Backlog</div>
            <div className="text-[10px] text-noir-500 mt-1">Avg response: 12 min</div>
          </div>
        </div>
      </div>
    </div>
  );
}
