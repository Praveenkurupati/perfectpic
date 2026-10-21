"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  User, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  ArrowUpRight,
  Eye,
  CheckCircle2,
  Info,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditEvent {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  category: "Orders" | "SLA" | "Pricing" | "Security" | "Refunds" | "Logistics";
  action: string;
  entityId: string;
  entityType: string;
  ipAddress: string;
  location: string;
  severity: "info" | "warning" | "critical";
  details: string;
  beforeValue?: string;
  afterValue?: string;
}

const mockAuditLogs: AuditEvent[] = [
  {
    id: "aud-1092",
    timestamp: "15 Oct 2026, 10:48 AM",
    actorName: "Vikram Sengupta",
    actorEmail: "vikram.ops@perfectpic.in",
    actorRole: "Operations Manager",
    category: "SLA",
    action: "SLA_STAGE_EXPEDITE",
    entityId: "PP-8491",
    entityType: "Order",
    ipAddress: "103.21.244.18",
    location: "Bangalore, IN",
    severity: "warning",
    details: "Marked order priority Level 1 to bypass standard press staging queue before 2 PM cutoff.",
    beforeValue: "Stage: printing (Elapsed: 14.5h)",
    afterValue: "Priority: Expedited / Staging Bay A Handover",
  },
  {
    id: "aud-1091",
    timestamp: "15 Oct 2026, 09:15 AM",
    actorName: "Sneha Nair",
    actorEmail: "sneha.support@perfectpic.in",
    actorRole: "Customer Concierge",
    category: "Logistics",
    action: "NDR_WHATSAPP_DISPATCH",
    entityId: "PP-8491",
    entityType: "Shipment",
    ipAddress: "49.37.152.90",
    location: "Mumbai, IN",
    severity: "info",
    details: "Triggered automated WhatsApp address confirmation form for Bandra delivery re-attempt.",
    beforeValue: "NDR Status: Gate Code Missing",
    afterValue: "Dispatched WhatsApp Location Form",
  },
  {
    id: "aud-1090",
    timestamp: "14 Oct 2026, 06:30 PM",
    actorName: "Praveen Kurupati",
    actorEmail: "praveen@perfectpic.in",
    actorRole: "Super Admin",
    category: "Pricing",
    action: "BUNDLE_TIER_SYNC",
    entityId: "BUNDLE-QUARTET",
    entityType: "BundleConfig",
    ipAddress: "122.179.88.10",
    location: "Hyderabad, IN",
    severity: "info",
    details: "Updated 4-Book Quartet pricing to authoritative MRP ₹6,399 (51.0% net margin).",
    beforeValue: "MRP: ₹6,499",
    afterValue: "MRP: ₹6,399 (Net Profit: ₹3,263)",
  },
  {
    id: "aud-1089",
    timestamp: "14 Oct 2026, 04:12 PM",
    actorName: "Rajesh Kannan",
    actorEmail: "rajesh.press@perfectpic.in",
    actorRole: "Production Floor Lead",
    category: "Orders",
    action: "PRESS_RUN_COMPLETE",
    entityId: "PP-8488",
    entityType: "Order",
    ipAddress: "103.21.244.22",
    location: "Bangalore, IN",
    severity: "info",
    details: "HP Indigo 12K ElectroInk press pass logged with zero color register defects. Sent to bindery.",
    beforeValue: "Status: printing",
    afterValue: "Status: qc",
  },
  {
    id: "aud-1088",
    timestamp: "14 Oct 2026, 01:05 PM",
    actorName: "Aditya Verma",
    actorEmail: "aditya.finance@perfectpic.in",
    actorRole: "Financial Analyst",
    category: "Refunds",
    action: "SETTLEMENT_RECONCILE",
    entityId: "RZP-BATCH-9921",
    entityType: "Settlement",
    ipAddress: "103.21.244.18",
    location: "Bangalore, IN",
    severity: "info",
    details: "Reconciled ₹42,850 T+2 automated payout against 14 captured photobook orders.",
    beforeValue: "Pending Reconciliation",
    afterValue: "Reconciled & Matched (Variance: ₹0.00)",
  },
  {
    id: "aud-1087",
    timestamp: "13 Oct 2026, 11:20 AM",
    actorName: "System Security Monitor",
    actorEmail: "security-bot@perfectpic.in",
    actorRole: "Security Daemon",
    category: "Security",
    action: "ADMIN_LOGIN_SUCCESS",
    entityId: "ADM-SESSION-48",
    entityType: "AuthSession",
    ipAddress: "103.21.244.18",
    location: "Bangalore, IN",
    severity: "info",
    details: "Super Admin JWT authentication issued with valid 2FA TOTP verification token.",
  },
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditEvent[]>(mockAuditLogs);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("All");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const categories = ["All", "Orders", "SLA", "Pricing", "Logistics", "Refunds", "Security"];

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
    setRefreshing(false);
  };

  const filteredLogs = logs.filter((l) => {
    if (selectedCategory !== "All" && l.category !== selectedCategory) return false;
    if (selectedSeverity !== "All" && l.severity !== selectedSeverity.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.action.toLowerCase().includes(q) ||
        l.actorName.toLowerCase().includes(q) ||
        l.actorEmail.toLowerCase().includes(q) ||
        l.entityId.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.ipAddress.includes(q)
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
              Security & Compliance Architecture
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Immutable Audit Ledger
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-noir-900 tracking-tight">
            System Audit Trail & Timeline
          </h1>
          <p className="text-sm text-noir-600 mt-1 max-w-2xl">
            Append-only audit log tracking administrative status changes, SLA escalations, pricing updates, financial reconciliations, and security sessions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-medium text-noir-800 bg-white border border-cream-300 rounded hover:bg-cream-50 transition-colors shadow-sm"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-foil-gold")} />
            Sync Logs
          </button>
          <button
            onClick={() => alert("Audit log export generated (CSV / JSON format).")}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-cream-50 bg-noir-950 rounded hover:bg-noir-900 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export Audit Trail
          </button>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-cream-200 rounded p-4 shadow-sm">
          <div className="text-[11px] font-mono uppercase tracking-wider text-noir-500 mb-1">
            Logged Events (30 Days)
          </div>
          <div className="font-serif text-2xl font-bold text-noir-900">1,842</div>
          <div className="text-[11px] text-noir-600 font-mono mt-1">
            Zero integrity tamper flags
          </div>
        </div>

        <div className="bg-white border border-cream-200 rounded p-4 shadow-sm">
          <div className="text-[11px] font-mono uppercase tracking-wider text-noir-500 mb-1">
            SLA Stage Overrides
          </div>
          <div className="font-serif text-2xl font-bold text-amber-600">3</div>
          <div className="text-[11px] text-noir-600 font-mono mt-1">
            Authorized by Operations Lead
          </div>
        </div>

        <div className="bg-white border border-cream-200 rounded p-4 shadow-sm">
          <div className="text-[11px] font-mono uppercase tracking-wider text-noir-500 mb-1">
            Pricing & Bundle Updates
          </div>
          <div className="font-serif text-2xl font-bold text-noir-900">1</div>
          <div className="text-[11px] text-emerald-600 font-mono mt-1">
            Authoritative 4-tier model active
          </div>
        </div>

        <div className="bg-white border border-cream-200 rounded p-4 shadow-sm">
          <div className="text-[11px] font-mono uppercase tracking-wider text-noir-500 mb-1">
            Active Admin Sessions
          </div>
          <div className="font-serif text-2xl font-bold text-noir-900">4</div>
          <div className="text-[11px] text-emerald-600 font-mono mt-1">
            All secured with 2FA TOTP
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-cream-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-noir-400" />
          <input
            type="text"
            placeholder="Search action, actor, order #, IP address..."
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

      {/* Audit Log Master Table */}
      <div className="bg-white border border-cream-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-cream-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-foil-gold" />
            <h2 className="font-serif text-lg text-noir-900 font-semibold">
              Event Audit Ledger
            </h2>
          </div>
          <span className="text-xs font-mono text-noir-500">
            Showing {filteredLogs.length} Events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-cream-50/80 text-noir-600 border-b border-cream-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp & Location</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Event Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4 text-right">Change Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-cream-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-noir-900">{log.timestamp}</div>
                    <div className="text-[10px] text-noir-500 flex items-center gap-1 mt-0.5">
                      <span>{log.ipAddress}</span>
                      <span>•</span>
                      <span>{log.location}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-sans">
                    <div className="font-semibold text-noir-950">{log.actorName}</div>
                    <div className="text-[11px] font-mono text-noir-500">{log.actorRole}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-block font-mono font-bold text-noir-900 bg-cream-100 px-2 py-0.5 rounded text-[10px]">
                      {log.action}
                    </span>
                    <div className="text-[10px] text-foil-gold mt-0.5">{log.category}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    {log.entityType === "Order" ? (
                      <Link
                        href={`/orders/${log.entityId}`}
                        className="text-foil-gold hover:underline font-bold inline-flex items-center gap-1"
                      >
                        {log.entityId}
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      </Link>
                    ) : (
                      <span className="font-semibold text-noir-800">{log.entityId}</span>
                    )}
                    <div className="text-[10px] text-noir-500">{log.entityType}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider",
                        log.severity === "info" && "bg-blue-50 text-blue-700 border border-blue-200",
                        log.severity === "warning" && "bg-amber-50 text-amber-700 border border-amber-200",
                        log.severity === "critical" && "bg-rose-50 text-rose-700 border border-rose-200"
                      )}
                    >
                      {log.severity}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedEvent(log)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 border border-cream-300 rounded text-[11px] text-noir-800 hover:bg-cream-100 transition-colors"
                    >
                      <Eye className="w-3 h-3 text-noir-500" />
                      Inspect Diff
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Details Inspector Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-noir-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-luxury-xl max-w-lg w-full border border-cream-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-foil-gold font-bold">
                  {selectedEvent.category} • {selectedEvent.id}
                </span>
                <h3 className="font-serif text-lg font-bold text-noir-950">
                  {selectedEvent.action}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-noir-400 hover:text-noir-900"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-noir-500 block mb-0.5">Execution Summary:</span>
                <p className="font-sans text-noir-900 bg-cream-50 p-2.5 rounded border border-cream-200 leading-relaxed">
                  {selectedEvent.details}
                </p>
              </div>

              {selectedEvent.beforeValue && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-2.5 rounded bg-rose-50/50 border border-rose-200">
                    <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block mb-1">
                      Before Change:
                    </span>
                    <span className="text-rose-900 break-words">{selectedEvent.beforeValue}</span>
                  </div>
                  <div className="p-2.5 rounded bg-emerald-50/50 border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block mb-1">
                      After Change:
                    </span>
                    <span className="text-emerald-900 break-words">{selectedEvent.afterValue}</span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-cream-200 text-[11px] text-noir-600 space-y-1">
                <div>Actor: <strong className="text-noir-900">{selectedEvent.actorName}</strong> ({selectedEvent.actorEmail})</div>
                <div>Network: {selectedEvent.ipAddress} ({selectedEvent.location})</div>
                <div>Timestamp: {selectedEvent.timestamp}</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 bg-noir-950 text-cream-50 rounded text-xs font-mono font-medium hover:bg-noir-900"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
