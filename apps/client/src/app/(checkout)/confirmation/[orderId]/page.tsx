'use client';

import { motion } from 'motion/react';
import Link from 'next/link';

export default function ConfirmationPage({ params }: { params: { orderId: string } }) {
  return (
    <div className="min-h-screen bg-cream-50 font-sans text-noir-900 py-20 px-4 flex flex-col items-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8 shadow-sm"
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </motion.div>

      <h1 className="font-serif text-5xl mb-4 text-center">Order Confirmed!</h1>
      <p className="text-noir-600 mb-12 text-center max-w-md">
        Thank you for choosing Whitebook. Your beautiful memories are now entering production.
      </p>

      <div className="w-full max-w-2xl bg-white p-8 rounded-sm shadow-sm border border-cream-200 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm mb-8 pb-8 border-b border-cream-200">
          <div>
            <span className="block text-xs text-noir-500 uppercase tracking-widest mb-1">Order ID</span>
            <span className="font-medium">#{params.orderId}</span>
          </div>
          <div>
            <span className="block text-xs text-noir-500 uppercase tracking-widest mb-1">Date</span>
            <span className="font-medium">26 Sep 2026</span>
          </div>
          <div>
            <span className="block text-xs text-noir-500 uppercase tracking-widest mb-1">Amount Paid</span>
            <span className="font-medium">₹3,099</span>
          </div>
          <div>
            <span className="block text-xs text-noir-500 uppercase tracking-widest mb-1">Est. Delivery</span>
            <span className="font-medium">3-5 Oct</span>
          </div>
        </div>

        {/* Timeline Stepper */}
        <div className="relative">
          <div className="absolute top-3 left-6 right-6 h-[2px] bg-cream-200" />
          <div className="absolute top-3 left-6 w-1/4 h-[2px] bg-foil-gold" />
          
          <div className="flex justify-between relative z-10">
            {['Paid', 'Production', 'Printing', 'Dispatched', 'Delivered'].map((step, i) => (
              <div key={step} className="flex flex-col items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white ${i === 0 ? 'border-foil-gold text-foil-gold' : 'border-cream-300 text-transparent'}`}>
                  <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-foil-gold' : ''}`} />
                </div>
                <span className={`text-xs font-medium ${i === 0 ? 'text-noir-900' : 'text-noir-400'}`}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button className="px-8 py-3 border border-noir-900 text-noir-900 rounded-sm font-medium hover:bg-cream-100 transition-colors">
          Download Design Proof
        </button>
        <Link href="/orders" className="px-8 py-3 bg-noir-950 text-cream-50 rounded-sm font-medium text-center hover:bg-noir-900 transition-colors">
          View My Orders
        </Link>
      </div>
    </div>
  );
}
