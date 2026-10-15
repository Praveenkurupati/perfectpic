"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Compass, 
  Users, 
  HeartHandshake, 
  Sparkles, 
  Layers, 
  Truck, 
  IndianRupee, 
  CreditCard, 
  ShieldCheck, 
  Download, 
  Edit3, 
  Plus, 
  CheckCircle2, 
  ExternalLink,
  Target,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CanvasBlock {
  id: string;
  title: string;
  icon: any;
  items: string[];
  color: string;
}

interface CanvasStructure {
  partners: CanvasBlock;
  activities: CanvasBlock;
  resources: CanvasBlock;
  valueProp: CanvasBlock;
  relationships: CanvasBlock;
  channels: CanvasBlock;
  segments: CanvasBlock;
  costStructure: CanvasBlock;
  revenueStreams: CanvasBlock;
}

export default function BusinessModelCanvasPage() {
  const [activeTab, setActiveTab] = useState<"canvas" | "moat">("canvas");

  const canvasData: CanvasStructure = {
    partners: {
      id: "partners",
      title: "Key Partners",
      icon: HeartHandshake,
      color: "border-blue-200 bg-blue-50/20",
      items: [
        "HP Indigo Digital Press Network (ElectroInk 6-color print heads)",
        "Fedrigoni Italy & Felix Schoeller (216gsm archival layflat paper)",
        "BlueDart Express Air (Primary all-India insured transit)",
        "Razorpay Payments (Instant UPI, Cards & Netbanking)",
        "Luxury wedding photographers & creator ambassador network",
      ],
    },
    activities: {
      id: "activities",
      title: "Key Activities",
      icon: Layers,
      color: "border-purple-200 bg-purple-50/20",
      items: [
        "Cloud-based WebGL photobook canvas rendering engine",
        "Automated photo resolution & bleed preflight verification",
        "Thermal layflat binding & velvet-touch lamination",
        "Algorithmic SLA routing & proactive NDR carrier remediation",
        "High-intent D2C digital customer acquisition",
      ],
    },
    resources: {
      id: "resources",
      title: "Key Resources",
      icon: Sparkles,
      color: "border-purple-200 bg-purple-50/20",
      items: [
        "Proprietary WebGL canvas editor architecture",
        "Exclusive Italian FSC-certified archival paper inventory",
        "Automated press imposition & color profile pipeline",
        "Dedicated customer concierge infrastructure",
      ],
    },
    valueProp: {
      id: "valueProp",
      title: "Value Propositions",
      icon: Award,
      color: "border-amber-300 bg-amber-50/40",
      items: [
        "Museum-grade heirloom photobooks delivered in 4 days across India",
        "Zero-effort smart auto-layout with face & horizon detection",
        "True layflat binding: opens 180° flat with zero photo loss in the gutter",
        "100-year colorfastness guarantee with HP ElectroInk pigment",
        "Archival keepsake presentation boxes included in multi-copy bundles",
      ],
    },
    relationships: {
      id: "relationships",
      title: "Customer Relationships",
      icon: Users,
      color: "border-emerald-200 bg-emerald-50/20",
      items: [
        "White-glove concierge support via WhatsApp & direct phone line",
        "Real-time SLA transparency with live production stage updates",
        "100% Satisfaction reprint guarantee for any binder or color flaw",
        "Milestone travel & anniversary automated re-engagement",
      ],
    },
    channels: {
      id: "channels",
      title: "Channels",
      icon: Truck,
      color: "border-emerald-200 bg-emerald-50/20",
      items: [
        "Direct-to-Consumer (D2C) web application (perfectpic.in)",
        "Creator & Influencer affiliate collaboration program",
        "Luxury wedding & destination event planner partnerships",
        "Corporate executive year-end gifting concierge",
      ],
    },
    segments: {
      id: "segments",
      title: "Customer Segments",
      icon: Target,
      color: "border-blue-200 bg-blue-50/20",
      items: [
        "Luxury travelers & international holidaymakers",
        "Newlyweds, couples & milestone anniversary celebrators",
        "New parents preserving baby & infant childhood memories",
        "Professional portfolio photographers & visual artists",
        "Corporate executives commissioning celebratory team archives",
      ],
    },
    costStructure: {
      id: "costStructure",
      title: "Cost Structure",
      icon: CreditCard,
      color: "border-rose-200 bg-rose-50/20",
      items: [
        "HP Indigo click charges & ElectroInk consumables (~₹515 base)",
        "Italian archival layflat paper stock & velvet lamination film",
        "Custom rigid presentation keepsake boxes & gold foil stamping (~₹110)",
        "Pan-India insured air express courier freight (~₹110 - ₹150)",
        "Cloud GPU canvas rendering & AWS S3 direct-presigned storage",
      ],
    },
    revenueStreams: {
      id: "revenueStreams",
      title: "Revenue Streams",
      icon: IndianRupee,
      color: "border-emerald-200 bg-emerald-50/30",
      items: [
        "Single Book Retail: ₹1,999 (55.7% net margin)",
        "Authoritative Volume Bundles: Duo (₹3,499), Quartet (₹6,399), Collector (₹8,999)",
        "Luxury Upgrades: Hardcover Italian Leather (+₹500), Keepsake Box (+₹499)",
        "Extra Page Spreads: ₹40 per 2-page archival spread",
        "Express Concierge Design Curation: ₹499",
      ],
    },
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-cream-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-foil-gold font-semibold">
              Executive Business Strategy
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Osterwalder Architecture
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-noir-900 tracking-tight">
            Business Model Canvas & Strategic Moat
          </h1>
          <p className="text-sm text-noir-600 mt-1 max-w-2xl">
            The standard 9-block enterprise canvas defining PerfectPic's value proposition, infrastructure, customer relationships, unit economics, and competitive defensibility.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-cream-100 p-0.5 rounded text-[11px] font-mono">
            <button
              onClick={() => setActiveTab("canvas")}
              className={cn(
                "px-3 py-1.5 rounded transition-colors",
                activeTab === "canvas" ? "bg-white text-noir-950 font-semibold shadow-xs" : "text-noir-600 hover:text-noir-950"
              )}
            >
              9-Block Canvas
            </button>
            <button
              onClick={() => setActiveTab("moat")}
              className={cn(
                "px-3 py-1.5 rounded transition-colors",
                activeTab === "moat" ? "bg-white text-noir-950 font-semibold shadow-xs" : "text-noir-600 hover:text-noir-950"
              )}
            >
              Strategic Moat (4 Pillars)
            </button>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-cream-50 bg-noir-950 rounded hover:bg-noir-900 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export Canvas
          </button>
        </div>
      </div>

      {activeTab === "canvas" ? (
        /* The Standard 9-Block Osterwalder Canvas Grid */
        <div className="space-y-4">
          {/* Top 5 Blocks (Partners, Activities, Value Prop, Relationships, Segments) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* 1. Key Partners (1 Col) */}
            <div className={cn("p-5 rounded-lg border flex flex-col justify-between shadow-sm", canvasData.partners.color)}>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <HeartHandshake className="w-4 h-4 text-blue-700" />
                  <h3 className="font-serif text-sm font-bold text-noir-950">{canvasData.partners.title}</h3>
                </div>
                <ul className="space-y-2 text-xs text-noir-800">
                  {canvasData.partners.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 2. Key Activities & Key Resources (1 Col split vertically) */}
            <div className="flex flex-col gap-4">
              <div className={cn("p-4 rounded-lg border flex-1 shadow-sm", canvasData.activities.color)}>
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-purple-700" />
                  <h3 className="font-serif text-sm font-bold text-noir-950">{canvasData.activities.title}</h3>
                </div>
                <ul className="space-y-1.5 text-xs text-noir-800">
                  {canvasData.activities.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-purple-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={cn("p-4 rounded-lg border flex-1 shadow-sm", canvasData.resources.color)}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-700" />
                  <h3 className="font-serif text-sm font-bold text-noir-950">{canvasData.resources.title}</h3>
                </div>
                <ul className="space-y-1.5 text-xs text-noir-800">
                  {canvasData.resources.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-purple-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 3. Value Propositions (Center 1 Col) */}
            <div className={cn("p-5 rounded-lg border flex flex-col justify-between shadow-sm", canvasData.valueProp.color)}>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-foil-gold" />
                  <h3 className="font-serif text-base font-bold text-noir-950">{canvasData.valueProp.title}</h3>
                </div>
                <ul className="space-y-2 text-xs text-noir-800">
                  {canvasData.valueProp.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-foil-gold font-bold">•</span>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-200 text-[10px] font-mono text-noir-600">
                Core Differentiator: Museum Archival Quality at D2C Speed
              </div>
            </div>

            {/* 4. Relationships & Channels (1 Col split vertically) */}
            <div className="flex flex-col gap-4">
              <div className={cn("p-4 rounded-lg border flex-1 shadow-sm", canvasData.relationships.color)}>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <h3 className="font-serif text-sm font-bold text-noir-950">{canvasData.relationships.title}</h3>
                </div>
                <ul className="space-y-1.5 text-xs text-noir-800">
                  {canvasData.relationships.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={cn("p-4 rounded-lg border flex-1 shadow-sm", canvasData.channels.color)}>
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-emerald-700" />
                  <h3 className="font-serif text-sm font-bold text-noir-950">{canvasData.channels.title}</h3>
                </div>
                <ul className="space-y-1.5 text-xs text-noir-800">
                  {canvasData.channels.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 5. Customer Segments (1 Col) */}
            <div className={cn("p-5 rounded-lg border flex flex-col justify-between shadow-sm", canvasData.segments.color)}>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-blue-700" />
                  <h3 className="font-serif text-sm font-bold text-noir-950">{canvasData.segments.title}</h3>
                </div>
                <ul className="space-y-2 text-xs text-noir-800">
                  {canvasData.segments.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom 2 Blocks (Cost Structure & Revenue Streams) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cost Structure */}
            <div className={cn("p-5 rounded-lg border shadow-sm", canvasData.costStructure.color)}>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-rose-700" />
                <h3 className="font-serif text-sm font-bold text-noir-950">{canvasData.costStructure.title}</h3>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-noir-800">
                {canvasData.costStructure.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Revenue Streams */}
            <div className={cn("p-5 rounded-lg border shadow-sm", canvasData.revenueStreams.color)}>
              <div className="flex items-center gap-2 mb-3">
                <IndianRupee className="w-4 h-4 text-emerald-700" />
                <h3 className="font-serif text-sm font-bold text-noir-950">{canvasData.revenueStreams.title}</h3>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-noir-800">
                {canvasData.revenueStreams.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Strategic Moat 4 Pillars */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg border border-cream-200 bg-white shadow-sm">
            <span className="text-xs font-mono uppercase tracking-widest text-foil-gold font-bold">Pillar 1</span>
            <h3 className="font-serif text-lg font-bold text-noir-900 mt-1 mb-2">
              Proprietary WebGL Canvas Engine
            </h3>
            <p className="text-xs text-noir-700 leading-relaxed">
              Unlike generic iframe embeds or bloated third-party photo editors, our in-house canvas uses hardware-accelerated WebGL rendering for instant two-finger mobile panning, true-scale print bleed guides, and 3D flipbook previews with zero frame drops.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-cream-200 bg-white shadow-sm">
            <span className="text-xs font-mono uppercase tracking-widest text-foil-gold font-bold">Pillar 2</span>
            <h3 className="font-serif text-lg font-bold text-noir-900 mt-1 mb-2">
              96-Hour Guaranteed SLA Pipeline
            </h3>
            <p className="text-xs text-noir-700 leading-relaxed">
              Most premium photobook printers require 10 to 14 business days. PerfectPic's direct prepress automation, real-time HP Indigo queue scheduling, and BlueDart air express integration guarantee delivery anywhere in India within 96 hours.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-cream-200 bg-white shadow-sm">
            <span className="text-xs font-mono uppercase tracking-widest text-foil-gold font-bold">Pillar 3</span>
            <h3 className="font-serif text-lg font-bold text-noir-900 mt-1 mb-2">
              Archival Material Exclusivity
            </h3>
            <p className="text-xs text-noir-700 leading-relaxed">
              Direct partnership with Fedrigoni Italy for 216gsm archival Lustre layflat paper, custom velvet-touch anti-scratch lamination, and museum-grade HP ElectroInk printing that ensures photos never yellow or crack across 100 years.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-cream-200 bg-white shadow-sm">
            <span className="text-xs font-mono uppercase tracking-widest text-foil-gold font-bold">Pillar 4</span>
            <h3 className="font-serif text-lg font-bold text-noir-900 mt-1 mb-2">
              Negative Working Capital Model
            </h3>
            <p className="text-xs text-noir-700 leading-relaxed">
              Customers pay 100% upfront via Razorpay UPI/Cards with instant T+2 settlement, while wholesale paper and bindery suppliers operate on 30-day corporate trade credit terms, generating strong organic cash flow for marketing reinvestment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
