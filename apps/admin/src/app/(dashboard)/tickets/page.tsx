"use client";

import { useState, useEffect } from "react";
import { tickets as fallbackTickets } from "@/lib/mock-data";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { MessageSquare, AlertCircle, RefreshCcw, PackageX, Loader2 } from "lucide-react";

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [ticketList, setTicketList] = useState<any[]>(fallbackTickets);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    adminApi.getTickets(activeTab)
      .then(res => {
        if (isMounted && res && res.tickets) {
          setTicketList(res.tickets);
        }
      })
      .catch(err => {
        console.warn("Using fallback ticket list:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Address Change': return <MessageSquare className="w-4 h-4" />;
      case 'Damage Report': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'Reprint Request': return <RefreshCcw className="w-4 h-4 text-amber-500" />;
      case 'Cancellation': return <PackageX className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold text-noir-950">Support Tickets</h1>
          <p className="text-sm text-noir-500 mt-1">Manage customer queries and issues.</p>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200">
        <div className="p-4 border-b border-cream-200 flex justify-between items-center">
          <div className="flex space-x-2">
            {["All", "Open", "In Progress", "Resolved", "Closed"].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-1.5 rounded-sm text-sm font-medium transition-colors",
                  activeTab === tab ? "bg-noir-950 text-cream-50" : "bg-cream-50 text-noir-600 hover:bg-cream-100"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          {loading && (
            <div className="flex items-center text-xs text-noir-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              Loading tickets...
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-50/50">
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider">Ticket</th>
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider">Type / Subject</th>
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider">Customer</th>
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {ticketList.map((t) => (
                <tr key={t.id} className="hover:bg-cream-50/50 transition-colors cursor-pointer group">
                  <td className="p-4">
                    <span className="font-medium text-sm text-noir-950">{t.id}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2 mb-1">
                      {getTypeIcon(t.type)}
                      <span className="text-xs font-medium text-noir-700">{t.type}</span>
                    </div>
                    <p className="text-sm text-noir-900">{t.subject}</p>
                  </td>
                  <td className="p-4 text-sm text-noir-600">{t.customer || t.customerEmail}</td>
                  <td className="p-4">
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm inline-block font-medium",
                      t.status === 'Open' || t.status === 'open' ? "bg-amber-100 text-amber-700" :
                      t.status === 'In Progress' || t.status === 'in_progress' ? "bg-blue-100 text-blue-700" :
                      "bg-green-100 text-green-700"
                    )}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-noir-500 text-right">{t.createdDate || t.createdAt?.substring(0, 10) || "Today"}</td>
                </tr>
              ))}
              {ticketList.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-noir-500">
                    No tickets found for status "{activeTab}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
