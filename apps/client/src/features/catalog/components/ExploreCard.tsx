"use client";

import Link from "next/link";
import { Star, ArrowRight, Compass } from "lucide-react";

export default function ExploreCard({ totalCount = 35 }: { totalCount?: number }) {
  return (
    <div className="bg-gradient-to-b from-[#fcfbf9] to-[#f5efe6] border border-neutral-300/80 hover:border-black rounded-2xl p-6 shadow-sm hover:shadow-luxury-md transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
      <div>
        {/* Top Header: Series Name (lowercase) & Badge */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-base font-bold tracking-tight text-neutral-400 lowercase select-none flex items-center gap-1.5">
            <Compass size={16} className="text-foil-gold" />
            <span>full collection</span>
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#fcedea] text-[#d96a54] lowercase tracking-wide">
            {totalCount}+ styles
          </span>
        </div>

        {/* 3D Stack of Photobooks Illustration */}
        <div className="h-72 w-full flex items-center justify-center py-4 px-2 mb-6 perspective-[1000px] relative">
          <Link href="/templates" className="relative w-full h-full flex items-center justify-center cursor-pointer">
            {/* Ambient floor shadow */}
            <div className="absolute bottom-2 w-48 h-8 bg-black/15 rounded-full blur-lg" />

            {/* Book 1 (Left slant, Kyoto green) */}
            <div className="absolute w-28 h-40 rounded-r-[3px] bg-[#A8C3A0] shadow-lg border border-black/10 transform -rotate-12 -translate-x-8 -translate-y-2 group-hover:-translate-x-10 group-hover:-rotate-16 transition-all duration-500 overflow-hidden flex">
              <div className="w-4 bg-black/20 flex items-center justify-center">
                <span className="text-[7px] font-bold text-white uppercase tracking-widest -rotate-90">KYOTO</span>
              </div>
              <div className="flex-1 bg-white/20 p-2 flex flex-col justify-end">
                <span className="text-[7px] text-white font-bold uppercase">ZEN</span>
              </div>
            </div>

            {/* Book 2 (Right slant, Golden hour) */}
            <div className="absolute w-28 h-40 rounded-r-[3px] bg-[#C9935B] shadow-lg border border-black/10 transform rotate-12 translate-x-8 -translate-y-2 group-hover:translate-x-10 group-hover:rotate-16 transition-all duration-500 overflow-hidden flex">
              <div className="w-4 bg-black/20 flex items-center justify-center">
                <span className="text-[7px] font-bold text-white uppercase tracking-widest -rotate-90">EUROPE</span>
              </div>
              <div className="flex-1 bg-white/20 p-2 flex flex-col justify-end">
                <span className="text-[7px] text-white font-bold uppercase">SUMMER</span>
              </div>
            </div>

            {/* Book 3 (Center foreground, Paris pink) */}
            <div className="relative w-32 h-44 rounded-r-[4px] bg-[#F8BAC7] shadow-2xl border border-black/15 transform group-hover:scale-105 transition-all duration-500 overflow-hidden flex z-10">
              <div className="w-5 bg-black/20 flex items-center justify-center">
                <span className="text-[8px] font-bold text-white uppercase tracking-widest -rotate-90">PARIS</span>
              </div>
              <div className="flex-1 relative overflow-hidden bg-neutral-800 p-2 flex flex-col justify-between">
                <img 
                  src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&auto=format&fit=crop" 
                  alt="Explore all books" 
                  className="absolute inset-0 w-full h-full object-cover opacity-80" 
                />
                <div className="relative z-10 text-center pt-2">
                  <span className="text-[9px] font-bold text-white tracking-widest uppercase">DISCOVER</span>
                </div>
                <div className="relative z-10 bg-black/60 rounded px-1.5 py-0.5 text-center">
                  <span className="text-[8px] font-bold text-white tracking-wider">ALL EDITIONS</span>
                </div>
              </div>
            </div>

            {/* Floating Counter Badge */}
            <div className="absolute -bottom-1 z-20 bg-white/95 backdrop-blur-sm border border-neutral-300 text-neutral-900 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-tight shadow-md flex items-center gap-1.5 group-hover:scale-110 transition-transform">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>+{Math.max(1, totalCount - 5)} More Books</span>
            </div>
          </Link>
        </div>

        {/* Rating & Price Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1">
            <div className="flex text-foil-gold">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star 
                  key={s} 
                  size={14} 
                  fill="currentColor" 
                  stroke="none" 
                  className="text-foil-gold" 
                />
              ))}
            </div>
            <span className="text-xs text-neutral-500 font-semibold ml-1">
              4.9 (500+ reviews)
            </span>
          </div>

          <div className="text-right flex items-baseline gap-1">
            <span className="text-[11px] text-neutral-400 lowercase">from</span>
            <span className="text-lg font-bold text-neutral-900 tracking-tight">
              ₹1,499
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-neutral-900 tracking-tight leading-snug lowercase">
          explore all {totalCount}+ books
        </h3>

        {/* Tagline */}
        <p className="text-xs text-neutral-500 mt-1 lowercase font-normal leading-relaxed">
          find the perfect aesthetic for your travels, milestones & memories
        </p>
      </div>

      {/* Button: explore full collection */}
      <div className="mt-6 pt-2">
        <Link
          href="/templates"
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-neutral-900 hover:bg-black text-white text-center text-sm font-semibold tracking-tight transition-all duration-200 shadow-sm group-hover:shadow"
        >
          <span>explore collection</span>
          <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
