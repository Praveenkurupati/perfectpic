"use client";

import { recentOrders } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Printer, Download, ChevronRight } from "lucide-react";

const columns = [
  { id: "pending", name: "Awaiting PDF", count: 12 },
  { id: "rendering", name: "Rendering", count: 2 },
  { id: "printing", name: "Printing", count: 45 },
  { id: "qc", name: "Quality Check", count: 8 },
  { id: "ready", name: "Ready to Ship", count: 15 },
];

export default function ProductionPage() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-end mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-noir-950">Production Queue</h1>
          <p className="text-sm text-noir-500 mt-1">Manage print renders and fulfillment pipeline.</p>
        </div>
        <div className="space-x-3">
          <button className="px-4 py-2 bg-cream-100 text-noir-900 rounded-sm text-sm font-medium hover:bg-cream-200 transition-colors border border-cream-300">
            Download All Ready
          </button>
          <button className="px-4 py-2 bg-noir-950 text-cream-50 rounded-sm text-sm font-medium hover:bg-noir-900 transition-colors">
            Batch Generate PDFs
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
        {columns.map(col => (
          <div key={col.id} className="flex-shrink-0 w-80 bg-cream-100/50 rounded-md border border-cream-200 flex flex-col">
            <div className="p-3 border-b border-cream-200 flex justify-between items-center bg-cream-100 rounded-t-md">
              <h3 className="font-semibold text-sm text-noir-900">{col.name}</h3>
              <span className="bg-cream-50 text-noir-600 text-xs px-2 py-0.5 rounded-full border border-cream-300">
                {col.count}
              </span>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white p-3 rounded-sm shadow-sm border border-cream-200 hover:border-foil-gold/50 cursor-pointer transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm text-noir-950">WB-849{i}</span>
                    <span className="text-[10px] bg-cream-100 text-noir-600 px-1.5 py-0.5 rounded-sm">8x8"</span>
                  </div>
                  <p className="text-xs text-noir-500 mb-3">40 Pages • Hardcover</p>
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-cream-100">
                    <div className="text-xs text-noir-400">Due: Oct 28</div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                      {col.id === 'pending' && <button className="p-1 text-noir-400 hover:text-noir-950"><Printer className="w-3.5 h-3.5" /></button>}
                      {col.id === 'ready' && <button className="p-1 text-noir-400 hover:text-noir-950"><Download className="w-3.5 h-3.5" /></button>}
                      <button className="p-1 text-noir-400 hover:text-noir-950"><ChevronRight className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
