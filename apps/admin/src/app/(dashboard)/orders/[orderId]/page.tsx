"use client";

import Link from "next/link";
import { ArrowLeft, Printer, Download, Truck, FileText, CheckCircle2 } from "lucide-react";
import { use } from "react";
import { cn } from "@/lib/utils";

export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/orders" className="p-2 hover:bg-cream-100 rounded-full transition-colors text-noir-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-noir-950 flex items-center gap-3">
              Order {orderId}
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm font-medium bg-blue-100 text-blue-700 inline-block align-middle">
                Confirmed
              </span>
            </h1>
            <p className="text-sm text-noir-500 mt-1">Placed on October 24, 2024 at 10:42 AM</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-cream-100 text-noir-900 rounded-sm text-sm font-medium hover:bg-cream-200 transition-colors flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Invoice
          </button>
          <button className="px-4 py-2 bg-noir-950 text-cream-50 rounded-sm text-sm font-medium hover:bg-noir-900 transition-colors flex items-center">
            <Printer className="w-4 h-4 mr-2" />
            Render PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Book Details */}
          <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200 p-6">
            <h2 className="text-lg font-semibold text-noir-950 mb-4 border-b border-cream-100 pb-2">Book Specifications</h2>
            <div className="flex gap-6">
              <div className="w-32 h-32 bg-cream-100 rounded-sm flex flex-col items-center justify-center text-noir-400 border border-cream-200">
                <span className="text-xs uppercase tracking-widest mt-2">Preview</span>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                  <p className="text-noir-500 mb-1">Size</p>
                  <p className="font-medium text-noir-900">8x8" Square</p>
                </div>
                <div>
                  <p className="text-noir-500 mb-1">Cover Type</p>
                  <p className="font-medium text-noir-900">Hardcover, Matte</p>
                </div>
                <div>
                  <p className="text-noir-500 mb-1">Page Count</p>
                  <p className="font-medium text-noir-900 tabular-nums">40 Pages</p>
                </div>
                <div>
                  <p className="text-noir-500 mb-1">Cover Color</p>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#F4F0E8] border border-cream-300"></span>
                    <span className="font-medium text-noir-900">Cream-100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200 p-6">
            <h2 className="text-lg font-semibold text-noir-950 mb-4 border-b border-cream-100 pb-2">Payment Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-noir-600">Base Book (20 pages)</span>
                <span className="font-medium tabular-nums">₹1,999</span>
              </div>
              <div className="flex justify-between">
                <span className="text-noir-600">Extra Pages (20 pages)</span>
                <span className="font-medium tabular-nums">₹400</span>
              </div>
              <div className="flex justify-between">
                <span className="text-noir-600">Shipping</span>
                <span className="font-medium tabular-nums">₹0</span>
              </div>
              <div className="pt-3 border-t border-cream-100 flex justify-between font-semibold text-base text-noir-950">
                <span>Total Paid</span>
                <span className="tabular-nums">₹2,399</span>
              </div>
              <div className="flex justify-between text-xs text-noir-500 mt-2">
                <span>Paid via Razorpay (pay_Oabc123)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200 p-6">
            <h2 className="text-lg font-semibold text-noir-950 mb-4 border-b border-cream-100 pb-2">Customer Info</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-noir-900">Praveen K.</p>
                <p className="text-noir-500">praveen@example.com</p>
                <p className="text-noir-500">+91 9876543210</p>
              </div>
              <div>
                <p className="text-noir-500 mb-1 font-medium">Shipping Address</p>
                <p className="text-noir-800 leading-relaxed">
                  123 Tech Park, Phase 1<br/>
                  Whitefield, Bangalore<br/>
                  Karnataka, 560066<br/>
                  India
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200 p-6">
            <h2 className="text-lg font-semibold text-noir-950 mb-4 border-b border-cream-100 pb-2">Timeline</h2>
            <div className="relative border-l border-cream-200 ml-3 space-y-6 pb-2">
              <div className="relative pl-6">
                <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white"></span>
                <p className="text-sm font-medium text-noir-900">Payment Confirmed</p>
                <p className="text-xs text-noir-500">Oct 24, 10:45 AM</p>
              </div>
              <div className="relative pl-6">
                <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-cream-300 ring-4 ring-white"></span>
                <p className="text-sm font-medium text-noir-900">Order Placed</p>
                <p className="text-xs text-noir-500">Oct 24, 10:42 AM</p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-cream-100">
              <button className="w-full py-2 bg-cream-100 text-noir-900 rounded-sm text-sm font-medium hover:bg-cream-200 transition-colors flex items-center justify-center">
                <Truck className="w-4 h-4 mr-2" />
                Mark as Dispatched
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
