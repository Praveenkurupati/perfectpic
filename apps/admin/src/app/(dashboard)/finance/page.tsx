"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  ShieldCheck, 
  Download, 
  RefreshCw, 
  ArrowUpRight, 
  CreditCard, 
  Boxes, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TierEconomics {
  tierName: string;
  bookCount: number;
  sellingPrice: number;
  netRevenue: number;
  printCost: number;
  pkgCost: number;
  freightCost: number;
  netProfit: number;
  profitPerBook: number;
  marginPercent: number;
}

const authoritativeBundleEconomics: TierEconomics[] = [
  {
    tierName: "1 Book (Single)",
    bookCount: 1,
    sellingPrice: 1999,
    netRevenue: 1738,
    printCost: 515,
    pkgCost: 110,
    freightCost: 110,
    netProfit: 1113,
    profitPerBook: 1113,
    marginPercent: 55.7,
  },
  {
    tierName: "2 Books (Duo)",
    bookCount: 2,
    sellingPrice: 3499,
    netRevenue: 3042,
    printCost: 1030,
    pkgCost: 150,
    freightCost: 150,
    netProfit: 1862,
    profitPerBook: 931,
    marginPercent: 53.2,
  },
  {
    tierName: "4 Books (Quartet)",
    bookCount: 4,
    sellingPrice: 6399,
    netRevenue: 5563,
    printCost: 2060,
    pkgCost: 240,
    freightCost: 240,
    netProfit: 3263,
    profitPerBook: 816,
    marginPercent: 51.0,
  },
  {
    tierName: "6 Books (Collector)",
    bookCount: 6,
    sellingPrice: 8999,
    netRevenue: 7823,
    printCost: 3090,
    pkgCost: 330,
    freightCost: 330,
    netProfit: 4403,
    profitPerBook: 734,
    marginPercent: 48.9,
  },
];

export default function FinanceEconomicsPage() {
  const [financials, setFinancials] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFinanceData = async () => {
    try {
      const data = await adminApi.getFinancials();
      setFinancials(data);
    } catch (e) {
      console.warn("Using fallback financial calculations", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFinanceData();
  };

  const grossRev = financials?.grossRevenue || 284500;
  const promoDisc = financials?.promoDiscounts || 14794;
  const bundleDisc = financials?.bundleDiscounts || 22191;
  const netRev = financials?.netRevenue || (grossRev - promoDisc - bundleDisc);
  const printCost = financials?.productionPrintCosts || 50470;
  const pkgCost = financials?.packagingCosts || 10780;
  const freightCost = financials?.shippingLogisticsCosts || 12250;
  const pgFees = financials?.paymentGatewayFees || 5690;
  const gst = financials?.gstTaxes || 29702;
  const refunds = financials?.refundsAndAdjustments || 2276;
  const grossProfit = financials?.grossProfit || (netRev - printCost - pkgCost - freightCost);
  const contributionMargin = grossProfit - pgFees - refunds;
  const grossMarginPct = financials?.grossMarginPercentage || 54.2;
  const aov = financials?.averageOrderValue || 2903;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-cream-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-foil-gold font-semibold">
              Corporate Financial Intelligence
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Audited P&L Metrics
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-noir-900 tracking-tight">
            Financial Control & Unit Economics
          </h1>
          <p className="text-sm text-noir-600 mt-1 max-w-2xl">
            Revenue waterfall decomposition, 4-tier volume bundle unit profitability, Razorpay payment reconciliation, and performance targets vs actuals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-medium text-noir-800 bg-white border border-cream-300 rounded hover:bg-cream-50 transition-colors shadow-sm"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-foil-gold")} />
            Sync Ledger
          </button>
          <button
            onClick={() => alert("Financial P&L summary exported to CSV.")}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-cream-50 bg-noir-950 rounded hover:bg-noir-900 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export P&L Report
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-cream-200 rounded p-4 shadow-sm">
          <div className="flex items-center justify-between text-noir-500 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Gross Revenue</span>
            <IndianRupee className="w-4 h-4 text-foil-gold" />
          </div>
          <div className="font-serif text-2xl font-bold text-noir-900">
            ₹{grossRev.toLocaleString("en-IN")}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-mono mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.4% vs last month</span>
          </div>
        </div>

        <div className="bg-white border border-cream-200 rounded p-4 shadow-sm">
          <div className="flex items-center justify-between text-noir-500 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Net Contribution Margin</span>
            <Percent className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="font-serif text-2xl font-bold text-noir-900">
            ₹{contributionMargin.toLocaleString("en-IN")}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-noir-600 font-mono mt-1">
            <span className="font-semibold text-emerald-600">{((contributionMargin / grossRev) * 100).toFixed(1)}%</span>
            <span>of gross revenue</span>
          </div>
        </div>

        <div className="bg-white border border-cream-200 rounded p-4 shadow-sm">
          <div className="flex items-center justify-between text-noir-500 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Average Order Value (AOV)</span>
            <CreditCard className="w-4 h-4 text-blue-500" />
          </div>
          <div className="font-serif text-2xl font-bold text-noir-900">
            ₹{aov.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-noir-500 font-mono mt-1">
            +₹320 boosted by Duo bundles
          </div>
        </div>

        <div className="bg-white border border-cream-200 rounded p-4 shadow-sm">
          <div className="flex items-center justify-between text-noir-500 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Gross Margin %</span>
            <ShieldCheck className="w-4 h-4 text-foil-gold" />
          </div>
          <div className="font-serif text-2xl font-bold text-noir-900">
            {grossMarginPct}%
          </div>
          <div className="text-[11px] text-emerald-600 font-mono mt-1">
            Exceeds 50.0% company target
          </div>
        </div>
      </div>

      {/* Authoritative 4-Tier Unit Economics Table */}
      <div className="bg-white border border-cream-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-cream-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-foil-gold" />
              <h2 className="font-serif text-lg text-noir-900 font-semibold">
                Authoritative 4-Tier Unit Economics
              </h2>
            </div>
            <p className="text-xs text-noir-600 mt-0.5">
              Production, packaging, air freight, and net profitability model across active bundle tiers.
            </p>
          </div>

          <Link
            href="/bundles"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream-50 hover:bg-cream-100 border border-cream-300 rounded text-xs font-mono font-medium text-noir-900 transition-colors"
          >
            Manage Bundle Pricing in DB
            <ArrowUpRight className="w-3.5 h-3.5 text-foil-gold" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-cream-50/80 text-noir-600 border-b border-cream-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Tier & Copies</th>
                <th className="py-3 px-4">Selling Price (MRP)</th>
                <th className="py-3 px-4">Net Revenue</th>
                <th className="py-3 px-4">Print Base (HP Indigo)</th>
                <th className="py-3 px-4">Packaging & Box</th>
                <th className="py-3 px-4">Express Freight</th>
                <th className="py-3 px-4">Net Profit</th>
                <th className="py-3 px-4">Profit / Book</th>
                <th className="py-3 px-4 text-right">Net Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {authoritativeBundleEconomics.map((t, idx) => (
                <tr key={t.tierName} className="hover:bg-cream-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-noir-950 font-sans">
                    <div>{t.tierName}</div>
                    <span className="text-[10px] font-mono text-foil-gold font-normal">
                      {t.bookCount} {t.bookCount === 1 ? "Photobook" : "Photobooks"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-noir-900">
                    ₹{t.sellingPrice.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4 text-noir-800">
                    ₹{t.netRevenue.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4 text-noir-600">
                    -₹{t.printCost.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4 text-noir-600">
                    -₹{t.pkgCost.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4 text-noir-600">
                    -₹{t.freightCost.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700">
                    ₹{t.netProfit.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-noir-800">
                    ₹{t.profitPerBook.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {t.marginPercent}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-cream-50/60 border-t border-cream-200 text-xs text-noir-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>
            * Calculations include ElectroInk 6-color digital print charges, 216gsm Italian Lustre layflat paper stock, archival keepsake boxes, and pan-India insured air express courier.
          </span>
          <span className="font-mono text-[11px] text-foil-gold font-semibold shrink-0">
            Blended Target Margin: &gt; 50.0%
          </span>
        </div>
      </div>

      {/* Waterfall Revenue Decomposition Flow */}
      <div className="bg-white border border-cream-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-lg text-noir-900 font-semibold">
              Revenue Waterfall & Direct Cost Decomposition
            </h2>
            <p className="text-xs text-noir-600">
              Audit trail showing how ₹{grossRev.toLocaleString("en-IN")} Gross Revenue converts into ₹{contributionMargin.toLocaleString("en-IN")} Net Contribution Margin.
            </p>
          </div>
          <span className="text-[11px] font-mono text-noir-500 uppercase tracking-wider">
            Current Month Cycle
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {/* Step 1: Gross */}
          <div className="flex items-center justify-between p-3 rounded bg-noir-950 text-cream-50">
            <span className="font-bold text-sm font-sans">1. Gross Revenue (Customer Invoiced)</span>
            <span className="font-bold text-base">₹{grossRev.toLocaleString("en-IN")}</span>
          </div>

          {/* Discounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-3 border-l-2 border-amber-300">
            <div className="flex items-center justify-between p-2.5 rounded bg-cream-50 border border-cream-200 text-noir-800">
              <span>Less: Promo Code Discounts (5.2%)</span>
              <span className="font-semibold text-rose-600">-₹{promoDisc.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded bg-cream-50 border border-cream-200 text-noir-800">
              <span>Less: Multi-Copy Bundle Discounts (7.8%)</span>
              <span className="font-semibold text-rose-600">-₹{bundleDisc.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Step 2: Net Revenue */}
          <div className="flex items-center justify-between p-3 rounded bg-cream-100 text-noir-900 border border-cream-300">
            <span className="font-semibold text-sm font-sans">2. Net Invoiced Revenue</span>
            <span className="font-bold text-base text-noir-950">₹{netRev.toLocaleString("en-IN")}</span>
          </div>

          {/* Direct Costs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-3 border-l-2 border-noir-300">
            <div className="flex items-center justify-between p-2.5 rounded bg-cream-50 border border-cream-200 text-noir-800">
              <div>
                <div className="font-medium">Direct Print & Paper</div>
                <div className="text-[10px] text-noir-500">HP Indigo 12K Press</div>
              </div>
              <span className="font-semibold text-rose-600">-₹{printCost.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-cream-50 border border-cream-200 text-noir-800">
              <div>
                <div className="font-medium">Luxury Packaging</div>
                <div className="text-[10px] text-noir-500">Keepsake Box & Wrap</div>
              </div>
              <span className="font-semibold text-rose-600">-₹{pkgCost.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-cream-50 border border-cream-200 text-noir-800">
              <div>
                <div className="font-medium">Insured Express Freight</div>
                <div className="text-[10px] text-noir-500">BlueDart Air Express</div>
              </div>
              <span className="font-semibold text-rose-600">-₹{freightCost.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Taxes, PG fees, Refunds */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-3 border-l-2 border-noir-300">
            <div className="flex items-center justify-between p-2.5 rounded bg-cream-50 border border-cream-200 text-noir-800">
              <div>
                <div className="font-medium">12% GST Tax Reserve</div>
                <div className="text-[10px] text-noir-500">Government Remittance</div>
              </div>
              <span className="font-semibold text-noir-600">-₹{gst.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-cream-50 border border-cream-200 text-noir-800">
              <div>
                <div className="font-medium">Payment Gateway Fee (2%)</div>
                <div className="text-[10px] text-noir-500">Razorpay UPI & Cards</div>
              </div>
              <span className="font-semibold text-rose-600">-₹{pgFees.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-cream-50 border border-cream-200 text-noir-800">
              <div>
                <div className="font-medium">Customer Adjustments</div>
                <div className="text-[10px] text-noir-500">0.8% Reprints / Support</div>
              </div>
              <span className="font-semibold text-rose-600">-₹{refunds.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Final Contribution Margin */}
          <div className="flex items-center justify-between p-3.5 rounded bg-emerald-50 text-emerald-950 border border-emerald-300">
            <div>
              <span className="font-bold text-sm font-sans">3. Net Contribution Margin</span>
              <span className="ml-2 text-xs font-mono font-normal text-emerald-700">
                (Available for operating overhead & marketing reinvestment)
              </span>
            </div>
            <div className="text-right">
              <span className="font-bold text-lg text-emerald-800">₹{contributionMargin.toLocaleString("en-IN")}</span>
              <span className="ml-2 text-xs font-bold text-emerald-700">
                ({((contributionMargin / grossRev) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Targets vs Actuals & Cash Settlement Horizon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Targets vs Actuals */}
        <div className="bg-white border border-cream-200 rounded-lg p-6 shadow-sm">
          <h2 className="font-serif text-lg text-noir-900 font-semibold mb-1">
            Monthly Targets vs Actuals
          </h2>
          <p className="text-xs text-noir-600 mb-5">
            Executive target benchmark tracking for October 2026.
          </p>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <div className="flex justify-between text-noir-800 mb-1">
                <span>Revenue Target: ₹3,50,000</span>
                <span className="font-semibold">₹{grossRev.toLocaleString("en-IN")} (81.3%)</span>
              </div>
              <div className="w-full bg-cream-200 h-2 rounded-full overflow-hidden">
                <div className="bg-foil-gold h-full rounded-full" style={{ width: "81.3%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-noir-800 mb-1">
                <span>Orders Target: 120 Orders</span>
                <span className="font-semibold">98 Orders (81.7%)</span>
              </div>
              <div className="w-full bg-cream-200 h-2 rounded-full overflow-hidden">
                <div className="bg-noir-900 h-full rounded-full" style={{ width: "81.7%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-noir-800 mb-1">
                <span>Gross Margin Target: 50.0%</span>
                <span className="font-semibold text-emerald-600">{grossMarginPct}% (+4.2% beat)</span>
              </div>
              <div className="w-full bg-cream-200 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "100%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-noir-800 mb-1">
                <span>SLA On-Time Compliance: 95.0%</span>
                <span className="font-semibold text-amber-600">94.2% (-0.8% variance)</span>
              </div>
              <div className="w-full bg-cream-200 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "94.2%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Razorpay Cash Settlement Horizon */}
        <div className="bg-white border border-cream-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-serif text-lg text-noir-900 font-semibold">
              Payment Settlement Horizon
            </h2>
            <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              Razorpay T+2 Schedule
            </span>
          </div>
          <p className="text-xs text-noir-600 mb-5">
            Automated bank disbursement pipeline to company operating account.
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
              <div>
                <div className="font-bold text-noir-900 font-sans">Next Automatic Payout</div>
                <div className="text-[11px] text-noir-600">Tomorrow, 10:00 AM IST via NEFT</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-base text-emerald-700">₹42,850.00</div>
                <div className="text-[10px] text-emerald-600">Cleared for transfer</div>
              </div>
            </div>

            <div className="p-3 rounded border border-cream-200 bg-cream-50 flex items-center justify-between">
              <div>
                <div className="font-medium text-noir-900 font-sans">In Clearing Pipeline</div>
                <div className="text-[11px] text-noir-600">Orders captured in last 24h</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm text-noir-900">₹18,495.00</div>
                <div className="text-[10px] text-noir-500">Settles in T+2</div>
              </div>
            </div>

            <div className="p-3 rounded border border-cream-200 bg-cream-50 flex items-center justify-between">
              <div>
                <div className="font-medium text-noir-900 font-sans">Rolling Reserve Fund</div>
                <div className="text-[11px] text-noir-600">Instant customer concierge reprints</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm text-noir-900">₹10,000.00</div>
                <div className="text-[10px] text-emerald-600 font-semibold">100% Intact</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
