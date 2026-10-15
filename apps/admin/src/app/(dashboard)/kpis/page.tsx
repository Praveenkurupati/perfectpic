"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  BookMarked, 
  Search, 
  Filter, 
  ShieldCheck, 
  ArrowUpRight, 
  Download, 
  Layers, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Database, 
  UserCheck, 
  Percent, 
  Tag
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiDefinition {
  id: string;
  name: string;
  code: string;
  category: "Financial" | "Operational" | "Production" | "Fulfillment" | "Product" | "Support";
  formula: string;
  targetBenchmark: string;
  currentActual: string;
  status: "on_target" | "watch" | "critical";
  ownerRole: string;
  updateFrequency: "Real-time" | "Daily" | "Monthly";
  dataSource: string;
  description: string;
}

const kpiDictionary: KpiDefinition[] = [
  {
    id: "kpi-bhs",
    name: "Business Health Score (BHS)",
    code: "BHS-100",
    category: "Operational",
    formula: "0.25*Rev + 0.15*Orders + 0.15*Prod + 0.20*SLA + 0.10*Pay + 0.10*Fulfill + 0.05*Support",
    targetBenchmark: "≥ 85 / 100",
    currentActual: "92 / 100",
    status: "on_target",
    ownerRole: "Chief Operating Officer",
    updateFrequency: "Real-time",
    dataSource: "OperationsService Composite Engine",
    description: "Holistic 7-dimension weighted health index assessing enterprise resilience across cash, press floor, shipping, and CSAT.",
  },
  {
    id: "kpi-gm",
    name: "Gross Margin %",
    code: "FIN-GM",
    category: "Financial",
    formula: "((Net Invoiced Revenue - Print Cost - Packaging - Freight) / Gross Revenue) * 100",
    targetBenchmark: "≥ 50.0%",
    currentActual: "54.2%",
    status: "on_target",
    ownerRole: "Chief Financial Officer",
    updateFrequency: "Daily",
    dataSource: "MongoDB Orders & Ledger Collection",
    description: "Percentage of gross customer spend retained after covering all direct manufacturing, keepsake presentation box, and courier shipping costs.",
  },
  {
    id: "kpi-cm",
    name: "Contribution Margin %",
    code: "FIN-CM",
    category: "Financial",
    formula: "((Gross Profit - 2% Payment Gateway Fee - Refunds/Reprints) / Gross Revenue) * 100",
    targetBenchmark: "≥ 45.0%",
    currentActual: "51.4%",
    status: "on_target",
    ownerRole: "Financial Analyst",
    updateFrequency: "Daily",
    dataSource: "Razorpay Ledger & Financial Service",
    description: "True net margin available for general corporate overhead, cloud GPU rendering infrastructure, and digital marketing acquisition.",
  },
  {
    id: "kpi-sla",
    name: "Order-to-Doorstep SLA Compliance",
    code: "OPS-SLA",
    category: "Fulfillment",
    formula: "(Orders Delivered ≤ 96 Hours / Total Delivered Orders) * 100",
    targetBenchmark: "≥ 95.0%",
    currentActual: "94.2%",
    status: "watch",
    ownerRole: "Logistics & Fulfillment Lead",
    updateFrequency: "Real-time",
    dataSource: "BlueDart Express Webhook & SlaService",
    description: "Percentage of custom photobooks delivered to the customer's doorstep within the guaranteed 4-day (96 hour) pan-India window.",
  },
  {
    id: "kpi-oee",
    name: "HP Indigo Press Efficiency (OEE)",
    code: "MFG-OEE",
    category: "Production",
    formula: "(Actual Completed Sheet Output / Theoretical Max Shift Capacity) * 100",
    targetBenchmark: "≥ 85.0%",
    currentActual: "88.4%",
    status: "on_target",
    ownerRole: "Production Floor Lead",
    updateFrequency: "Daily",
    dataSource: "HP PrintOS API & Factory Telemetry",
    description: "Availability and throughput efficiency of the primary HP Indigo 12K digital press during production shifts.",
  },
  {
    id: "kpi-bindery",
    name: "Layflat Binding Defect Rate",
    code: "QC-DEF",
    category: "Production",
    formula: "(Defective Books Flagged at QC Inspection / Total Books Bound) * 100",
    targetBenchmark: "< 1.5%",
    currentActual: "0.6%",
    status: "on_target",
    ownerRole: "Quality Assurance Specialist",
    updateFrequency: "Daily",
    dataSource: "QC Terminal Station Log",
    description: "Books failing thermal layflat binding adhesion, corner squareness, or velvet matte lamination inspection.",
  },
  {
    id: "kpi-ndr",
    name: "NDR Resolution Success Rate",
    code: "LOG-NDR",
    category: "Fulfillment",
    formula: "(NDR Cases Successfully Delivered / Total NDR Exceptions Raised) * 100",
    targetBenchmark: "≥ 90.0%",
    currentActual: "94.8%",
    status: "on_target",
    ownerRole: "Customer Concierge Lead",
    updateFrequency: "Real-time",
    dataSource: "Courier Webhook & Concierge CRM",
    description: "Percentage of delivery exception reports (missing address, phone unreachable) converted into successful deliveries without RTO.",
  },
  {
    id: "kpi-conv",
    name: "Storefront to Purchase Conversion",
    code: "MKT-CR",
    category: "Product",
    formula: "(Paid Orders Completed / Total Unique Storefront Visitors) * 100",
    targetBenchmark: "≥ 6.0%",
    currentActual: "8.4%",
    status: "on_target",
    ownerRole: "Head of Growth",
    updateFrequency: "Real-time",
    dataSource: "Clickstream Telemetry & Funnel Engine",
    description: "End-to-end commercial conversion rate from visitor discovery to completed Razorpay payment transaction.",
  },
  {
    id: "kpi-editor",
    name: "Canvas Editor Completion Rate",
    code: "UX-COMP",
    category: "Product",
    formula: "(Projects Reaching Cart / Projects Initialized) * 100",
    targetBenchmark: "≥ 60.0%",
    currentActual: "64.8%",
    status: "on_target",
    ownerRole: "Chief Product Officer",
    updateFrequency: "Real-time",
    dataSource: "WebGL Canvas Event Stream",
    description: "Percentage of users who initialize a photobook project and successfully layout all photo spreads to add to cart.",
  },
  {
    id: "kpi-fcr",
    name: "First Contact Resolution (FCR)",
    code: "CS-FCR",
    category: "Support",
    formula: "(Support Tickets Resolved in 1 Interaction / Total Tickets Logged) * 100",
    targetBenchmark: "≥ 85.0%",
    currentActual: "89.2%",
    status: "on_target",
    ownerRole: "Customer Support Lead",
    updateFrequency: "Daily",
    dataSource: "Support Ticket Database",
    description: "Customer inquiries resolved in a single WhatsApp or phone exchange without secondary follow-up delay.",
  },
];

export default function KpiDictionaryPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Financial", "Operational", "Production", "Fulfillment", "Product", "Support"];

  const filteredKpis = kpiDictionary.filter((k) => {
    if (selectedCategory !== "All" && k.category !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        k.name.toLowerCase().includes(q) ||
        k.code.toLowerCase().includes(q) ||
        k.ownerRole.toLowerCase().includes(q) ||
        k.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-cream-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-foil-gold font-semibold">
              Corporate Governance & Analytics
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              10 Audited Metrics
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-noir-900 tracking-tight">
            Company KPI Dictionary
          </h1>
          <p className="text-sm text-noir-600 mt-1 max-w-2xl">
            Standardized enterprise formulas, benchmark thresholds, data sources, and departmental accountability owners across PerfectPic.
          </p>
        </div>

        <button
          onClick={() => alert("KPI dictionary exported to JSON.")}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-cream-50 bg-noir-950 rounded hover:bg-noir-900 transition-colors shadow-sm self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Export Dictionary
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white border border-cream-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-noir-400" />
          <input
            type="text"
            placeholder="Search metric name, code, formula, owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-mono border border-cream-300 rounded focus:outline-none focus:border-foil-gold bg-cream-50/50"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-[11px] font-mono">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1 rounded transition-colors whitespace-nowrap",
                selectedCategory === cat
                  ? "bg-noir-950 text-cream-50 font-semibold"
                  : "bg-cream-100 text-noir-700 hover:text-noir-950"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Dictionary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredKpis.map((kpi) => (
          <div
            key={kpi.id}
            className="p-5 rounded-lg border border-cream-200 bg-white shadow-sm flex flex-col justify-between hover:border-foil-gold/50 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cream-100 text-noir-700 font-bold">
                    {kpi.code}
                  </span>
                  <span className="text-[10px] font-mono text-foil-gold uppercase tracking-wider font-semibold">
                    {kpi.category}
                  </span>
                </div>

                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider",
                    kpi.status === "on_target" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                    kpi.status === "watch" && "bg-amber-50 text-amber-700 border border-amber-200",
                    kpi.status === "critical" && "bg-rose-50 text-rose-700 border border-rose-200"
                  )}
                >
                  {kpi.status.replace("_", " ")}
                </span>
              </div>

              <h3 className="font-serif text-base font-bold text-noir-950 mb-1">
                {kpi.name}
              </h3>
              <p className="text-xs text-noir-600 mb-3 leading-relaxed">
                {kpi.description}
              </p>

              {/* Mathematical Formula Box */}
              <div className="p-2.5 rounded bg-cream-50 border border-cream-200 font-mono text-[11px] text-noir-800 mb-3 break-all">
                <span className="text-noir-400 select-none">Formula: </span>
                <span className="font-semibold">{kpi.formula}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-cream-100 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center text-noir-700">
                <span className="text-noir-500">Target Benchmark:</span>
                <span className="font-semibold text-noir-900">{kpi.targetBenchmark}</span>
              </div>
              <div className="flex justify-between items-center text-noir-700">
                <span className="text-noir-500">Current Actual:</span>
                <span className="font-bold text-emerald-700">{kpi.currentActual}</span>
              </div>
              <div className="flex justify-between items-center text-noir-700">
                <span className="text-noir-500">Accountable Owner:</span>
                <span className="font-semibold text-noir-900">{kpi.ownerRole}</span>
              </div>
              <div className="flex justify-between items-center text-noir-500 text-[10px] pt-1">
                <span>Update: {kpi.updateFrequency}</span>
                <span>Source: {kpi.dataSource}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
