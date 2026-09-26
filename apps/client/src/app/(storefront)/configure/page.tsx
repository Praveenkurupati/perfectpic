"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ConfigurePage() {
  const [step, setStep] = useState(1);
  const [size, setSize] = useState("8.25");
  const [cover, setCover] = useState("hardcover");
  const [theme, setTheme] = useState("minimal");
  const [packaging, setPackaging] = useState("standard");
  
  const basePrice = 1999;
  let currentPrice = basePrice;
  if (size === "10") currentPrice += 500;
  if (packaging === "keepsake") currentPrice += 800;

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 min-h-screen">
      <h1 className="font-serif text-4xl md:text-5xl text-noir-900 mb-4">Configure Your Photobook</h1>
      
      {/* Step Indicator */}
      <div className="flex items-center space-x-2 text-sm uppercase tracking-[0.2em] font-medium text-noir-700 mb-12 overflow-x-auto pb-4">
        <span className={cn(step >= 1 ? "text-noir-950" : "")}>1. Size</span>
        <ChevronRight size={14} className="text-cream-300" />
        <span className={cn(step >= 2 ? "text-noir-950" : "")}>2. Cover</span>
        <ChevronRight size={14} className="text-cream-300" />
        <span className={cn(step >= 3 ? "text-noir-950" : "")}>3. Theme</span>
        <ChevronRight size={14} className="text-cream-300" />
        <span className={cn(step >= 4 ? "text-noir-950" : "")}>4. Color</span>
        <ChevronRight size={14} className="text-cream-300" />
        <span className={cn(step >= 5 ? "text-noir-950" : "")}>5. Packaging</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          
          {/* Size Selector */}
          <section>
            <h2 className="font-sans text-xl font-semibold mb-6">Select Size</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => setSize("8.25")}
                className={cn(
                  "p-6 border rounded-sm text-left transition-all",
                  size === "8.25" ? "border-noir-950 bg-cream-100 shadow-luxury-md" : "border-cream-300 hover:border-noir-900 bg-white"
                )}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="w-16 h-16 bg-cream-300 flex items-center justify-center font-serif text-sm">8.25"</div>
                  {size === "8.25" && <Check className="text-noir-950" />}
                </div>
                <h3 className="font-semibold text-lg">Standard Square</h3>
                <p className="text-noir-700 text-sm">8.25" × 8.25"</p>
                <p className="mt-2 font-medium">₹1,999</p>
              </button>

              <button 
                onClick={() => setSize("10")}
                className={cn(
                  "p-6 border rounded-sm text-left transition-all",
                  size === "10" ? "border-noir-950 bg-cream-100 shadow-luxury-md" : "border-cream-300 hover:border-noir-900 bg-white"
                )}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="w-20 h-20 bg-cream-300 flex items-center justify-center font-serif text-sm">10"</div>
                  {size === "10" && <Check className="text-noir-950" />}
                </div>
                <h3 className="font-semibold text-lg">Large Square</h3>
                <p className="text-noir-700 text-sm">10" × 10"</p>
                <p className="mt-2 font-medium">₹2,499</p>
              </button>
            </div>
          </section>

          {/* More configuration sections would go here... */}
          <section className="opacity-50 pointer-events-none">
            <h2 className="font-sans text-xl font-semibold mb-6">Cover Type</h2>
            <div className="p-6 border border-cream-300 bg-white rounded-sm">Hardcover Laminar selected by default.</div>
          </section>

        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-cream-100 p-8 border border-cream-300 rounded-sm shadow-luxury-sm">
            <h3 className="font-serif text-2xl font-semibold mb-6 border-b border-cream-300 pb-4">Summary</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between">
                <span className="text-noir-700">Size: {size === "8.25" ? '8.25" × 8.25"' : '10" × 10"'}</span>
                <span>₹{size === "8.25" ? '1,999' : '2,499'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-noir-700">Cover: Hardcover</span>
                <span>Included</span>
              </div>
              <div className="flex justify-between">
                <span className="text-noir-700">Pages: 40 included</span>
                <span>Included</span>
              </div>
              {packaging === "keepsake" && (
                <div className="flex justify-between">
                  <span className="text-noir-700">Packaging: Keepsake Box</span>
                  <span>₹800</span>
                </div>
              )}
            </div>

            <div className="border-t border-cream-300 pt-4 mb-8">
              <div className="flex justify-between items-center font-bold text-xl">
                <span>Total</span>
                <span>₹{currentPrice.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-xs text-noir-700 mt-2">Taxes included. Free shipping PAN India.</p>
            </div>

            <Link 
              href="/editor" 
              className="w-full flex items-center justify-center px-6 py-4 bg-noir-950 text-cream-50 font-medium hover:bg-noir-900 transition-colors rounded-sm"
            >
              Continue to Upload Photos <ArrowRight size={18} className="ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
