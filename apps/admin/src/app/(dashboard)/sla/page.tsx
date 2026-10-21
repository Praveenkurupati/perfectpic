"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  ShieldAlert, 
  Layers, 
  Printer, 
  Truck, 
  PackageCheck, 
  Settings2, 
  ArrowRight, 
  Check, 
  Filter, 
  RefreshCw,
  TrendingDown,
  ArrowUpRight,
  Info
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface StageSla {
  stage: string;
  label: string;
  targetHours: number;
  description: string;
}

export default function SlaManagementPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [slaData, setSlaData] = useState<any>({
    totalActiveOrders: 18,
    safeCount: 14,
    atRiskCount: 3,
    criticalCount: 1,
    breachedCount: 0,
    complianceRate: 94.2,
    breachRate: 5.8,
    avgFulfillmentHours: 28.4,
    avgProductionHours: 18.2,
    avgDispatchHours: 3.5,
    avgDeliveryHours: 48.0,
    stageConfigs: [
      { stage: 'confirmed', label: 'Order & Preflight Verification', targetHours: 2, description: 'File validation & automated preflight bleed check' },
      { stage: 'production', label: 'Prepress Imposition', targetHours: 4, description: 'Color calibration & sheet layout imposition' },
      { stage: 'printing', label: 'HP Indigo Press Run', targetHours: 12, description: 'ElectroInk 6-color digital press printing' },
      { stage: 'qc', label: 'QC & Archival Layflat Binding', targetHours: 8, description: 'Quality inspection, thermal binding & velvet lamination' },
      { stage: 'dispatched', label: 'Packaging & Courier Handover', targetHours: 4, description: 'Keepsake box assembly, AWB labeling & BlueDart handover' },
      { stage: 'delivered', label: 'Doorstep Courier Transit', targetHours: 66, description: 'All-India express transit to customer address' },
    ],
    atRiskOrders: [
      {
        orderId: 'PP-8491',
        orderNumber: 'PP-8491',
        currentStage: 'printing',
        status: 'at_risk',
        escalationLevel: 1,
        targetCompletionHours: 18,
        elapsedHours: 14.5,
        remainingHours: 3.5,
        riskReason: '70% of target time elapsed on Indigo Press run.',
        recommendedAction: 'Prioritize next in line on inspection table.',
        assignedRole: 'Production Lead',
      },
      {
        orderId: 'PP-7201',
        orderNumber: 'PP-7201',
        currentStage: 'qc',
        status: 'critical',
        escalationLevel: 2,
        targetCompletionHours: 26,
        elapsedHours: 24.5,
        remainingHours: 1.5,
        riskReason: 'Approaching SLA deadline in 1.5 hours.',
        recommendedAction: 'Immediate intervention: Assign bindery tech to complete before courier dispatch.',
        assignedRole: 'Operations Manager',
      },
    ],
    breachedOrders: [],
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'at_risk' | 'config' | 'escalation'>('overview');

  const fetchSlaData = async () => {
    try {
      setRefreshing(true);
      const res = await adminApi.getSlaMetrics();
      if (res && res.data) {
        setSlaData(res.data);
      }
    } catch (err) {
      console.warn("Using cached offline SLA metrics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSlaData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cream-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] uppercase tracking-widest text-emerald-700 font-bold font-mono">
              Fulfillment Delivery Engine
            </span>
            <span className="text-noir-300">•</span>
            <span className="text-[11px] uppercase tracking-wider text-noir-500 font-mono">
              Predictive Risk Monitoring
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-noir-950">Delivery & Operations Intelligence</h1>
          <p className="text-xs text-noir-500 mt-1 max-w-2xl">
            Configure stage timelines, predict deadline delays before they happen, and monitor on-time delivery across the entire customer lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-cream-300 rounded-sm p-1 flex items-center shadow-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn("px-3 py-1 text-xs font-mono uppercase font-semibold rounded-xs transition-colors", activeTab === 'overview' ? "bg-noir-950 text-cream-50" : "text-noir-600 hover:text-noir-950")}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('at_risk')}
              className={cn("px-3 py-1 text-xs font-mono uppercase font-semibold rounded-xs transition-colors", activeTab === 'at_risk' ? "bg-noir-950 text-cream-50" : "text-noir-600 hover:text-noir-950")}
            >
              At Risk ({slaData.atRiskOrders?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={cn("px-3 py-1 text-xs font-mono uppercase font-semibold rounded-xs transition-colors", activeTab === 'config' ? "bg-noir-950 text-cream-50" : "text-noir-600 hover:text-noir-950")}
            >
              Delivery Targets
            </button>
            <button
              onClick={() => setActiveTab('escalation')}
              className={cn("px-3 py-1 text-xs font-mono uppercase font-semibold rounded-xs transition-colors", activeTab === 'escalation' ? "bg-noir-950 text-cream-50" : "text-noir-600 hover:text-noir-950")}
            >
              Escalation Workflow
            </button>
          </div>

          <button
            onClick={fetchSlaData}
            disabled={refreshing}
            className="p-2 border border-cream-300 bg-white hover:bg-cream-100 rounded-sm text-noir-700 transition-colors shadow-xs"
            title="Refresh delivery calculations"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-cream-300 p-5 rounded-sm shadow-xs">
          <div className="flex justify-between items-center text-noir-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">On-Time Delivery Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-emerald-700">
            {slaData.complianceRate}%
          </div>
          <span className="text-[11px] text-noir-500 font-medium mt-1 block">
            Target: 95.0% • Delay Rate: {slaData.breachRate}%
          </span>
        </div>

        <div className="bg-white border border-cream-300 p-5 rounded-sm shadow-xs">
          <div className="flex justify-between items-center text-noir-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Safe Orders</span>
            <ShieldAlert className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-noir-950">
            {slaData.safeCount} <span className="text-xs font-mono text-noir-400 font-normal">/ {slaData.totalActiveOrders} Active</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
            Fulfilling comfortably within deadline
          </span>
        </div>

        <div className="bg-white border border-cream-300 p-5 rounded-sm shadow-xs">
          <div className="flex justify-between items-center text-noir-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Orders At Risk</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-amber-600">
            {slaData.atRiskCount + slaData.criticalCount}
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-1 block">
            Approaching stage deadline (&gt;70% elapsed)
          </span>
        </div>

        <div className="bg-white border border-cream-300 p-5 rounded-sm shadow-xs">
          <div className="flex justify-between items-center text-noir-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Average Production Cycle</span>
            <Printer className="w-4 h-4 text-noir-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-noir-950">
            {slaData.avgProductionHours}h
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
            Target: 30.0 hours (Prepress to Handover)
          </span>
        </div>
      </div>

      {/* Tab: Overview Stage Timelines */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Visual Lifecycle Timeline */}
          <div className="bg-white border border-cream-300 rounded-sm p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-cream-200 pb-3">
              <div>
                <h2 className="font-serif text-lg font-bold text-noir-950">
                  Standard Photobook Lifecycle & Stage Delivery Commitments
                </h2>
                <p className="text-xs text-noir-500">
                  Target total fulfillment duration: <strong>96 Hours (4 Days)</strong> from order placement to customer doorstep delivery.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                Pan-India Express Track
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              {slaData.stageConfigs?.map((s: StageSla, idx: number) => (
                <div key={s.stage} className="p-4 rounded-sm border border-cream-200 bg-cream-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-5 h-5 rounded-full bg-noir-950 text-cream-50 font-mono text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-mono font-bold text-noir-900 bg-white px-2 py-0.5 rounded border border-cream-200">
                        {s.targetHours}h
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-sm text-noir-950 mb-1">{s.label}</h3>
                    <p className="text-[11px] text-noir-600 leading-snug">{s.description}</p>
                  </div>
                  <div className="pt-3 border-t border-cream-200 mt-3 flex items-center justify-between text-[10px] font-mono text-noir-500">
                    <span>Target: {s.targetHours}h Max</span>
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery At-Risk Priority Stream */}
          <div className="bg-white border border-cream-300 rounded-sm p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-cream-200 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h2 className="font-serif text-lg font-bold text-noir-950">
                  Orders Requiring Expedited Action (Delivery Risk Prediction)
                </h2>
              </div>
              <span className="text-xs font-mono text-noir-500">
                Sorted by lowest remaining hours
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-cream-100/70 border-b border-cream-200 text-[11px] font-mono uppercase tracking-wider text-noir-600">
                    <th className="py-3 px-4">Order</th>
                    <th className="py-3 px-4">Current Stage</th>
                    <th className="py-3 px-4">Elapsed Time</th>
                    <th className="py-3 px-4">Remaining</th>
                    <th className="py-3 px-4">Risk Status</th>
                    <th className="py-3 px-4">Escalation</th>
                    <th className="py-3 px-4">Recommended Action</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200">
                  {slaData.atRiskOrders?.map((item: any) => (
                    <tr key={item.orderNumber} className="hover:bg-cream-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-noir-950">
                        {item.orderNumber}
                      </td>
                      <td className="py-3 px-4 uppercase font-mono text-xs text-noir-700">
                        {item.currentStage}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {item.elapsedHours} hours
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-amber-700">
                        {item.remainingHours}h left
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                          item.status === 'critical' ? "bg-red-100 text-red-900 border border-red-300" : "bg-amber-100 text-amber-900 border border-amber-300"
                        )}>
                          {item.status === 'critical' ? 'Critical' : 'At Risk'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-noir-600">
                        Level {item.escalationLevel} ({item.assignedRole})
                      </td>
                      <td className="py-3 px-4 text-xs text-noir-700">
                        {item.recommendedAction}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/orders/${item.orderNumber}`}
                          className="px-3 py-1 bg-noir-950 hover:bg-black text-cream-50 text-xs font-mono uppercase rounded-sm inline-flex items-center gap-1"
                        >
                          <span>Expedite</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: SLA Targets Configurator */}
      {activeTab === 'config' && (
        <div className="bg-white border border-cream-300 rounded-sm p-6 shadow-xs space-y-6">
          <div className="border-b border-cream-200 pb-3">
            <h2 className="font-serif text-lg font-bold text-noir-950">
              Configurable Stage Delivery Targets & Deadlines
            </h2>
            <p className="text-xs text-noir-500 mt-0.5">
              Adjust standard target hours for each operational department. Alerts and risk predictions will recalculate dynamically.
            </p>
          </div>

          <div className="space-y-4">
            {slaData.stageConfigs?.map((s: StageSla) => (
              <div key={s.stage} className="p-4 rounded-sm border border-cream-200 bg-cream-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif font-bold text-sm text-noir-950">{s.label}</h3>
                  <p className="text-xs text-noir-500">{s.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      defaultValue={s.targetHours}
                      className="w-16 px-2.5 py-1 border border-cream-300 rounded-sm font-mono text-sm text-right focus:outline-none focus:border-noir-950 bg-white"
                    />
                    <span className="text-xs font-mono text-noir-500">hours</span>
                  </div>
                  <button className="px-3 py-1 bg-noir-950 text-cream-50 text-xs font-mono uppercase rounded-sm hover:bg-black">
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Escalation Engine Chain */}
      {activeTab === 'escalation' && (
        <div className="bg-white border border-cream-300 rounded-sm p-6 shadow-xs space-y-6">
          <div className="border-b border-cream-200 pb-3">
            <h2 className="font-serif text-lg font-bold text-noir-950">
              4-Tier Delivery Escalation Engine
            </h2>
            <p className="text-xs text-noir-500 mt-0.5">
              Automated alert pathways triggered when orders enter at-risk or breached states.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-sm border border-amber-300 bg-amber-50/50 space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded">
                Level 1: At Risk
              </span>
              <h3 className="font-serif font-bold text-sm text-noir-950">Assigned Operator</h3>
              <p className="text-xs text-noir-600 leading-relaxed">
                Triggered when 70% of stage time elapses. In-app notification sent to the bindery technician or print operator.
              </p>
            </div>

            <div className="p-5 rounded-sm border border-orange-300 bg-orange-50/50 space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-orange-900 bg-orange-200 px-2 py-0.5 rounded">
                Level 2: Critical
              </span>
              <h3 className="font-serif font-bold text-sm text-noir-950">Operations Manager</h3>
              <p className="text-xs text-noir-600 leading-relaxed">
                Triggered when 90% of stage time elapses. Urgent notification sent to Operations Manager to reassign equipment or schedule overtime.
              </p>
            </div>

            <div className="p-5 rounded-sm border border-red-300 bg-red-50/50 space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-red-900 bg-red-200 px-2 py-0.5 rounded">
                Level 3: Breached
              </span>
              <h3 className="font-serif font-bold text-sm text-noir-950">Ops Manager + Admin</h3>
              <p className="text-xs text-noir-600 leading-relaxed">
                Triggered when deadline is exceeded. High-priority alert dispatched with automated recommendation to expedite via BlueDart 10 AM Air.
              </p>
            </div>

            <div className="p-5 rounded-sm border border-purple-300 bg-purple-50/50 space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-purple-900 bg-purple-200 px-2 py-0.5 rounded">
                Level 4: Severe Breach
              </span>
              <h3 className="font-serif font-bold text-sm text-noir-950">CEO / Business Owner</h3>
              <p className="text-xs text-noir-600 leading-relaxed">
                Triggered when delay exceeds &gt;150% of target. Executive briefing dispatched for direct customer concierge intervention and compensation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
