'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { CheckCircle2, PackageCheck, Printer, Truck, FileText, Download, Loader2 } from 'lucide-react';
import { generateOrderReceiptPdf } from '@/lib/pdfGenerator';

export default function ConfirmationPage() {
  const params = useParams();
  const orderId = (params?.orderId as string) || '';

  const [order, setOrder] = useState<any>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    api.getOrder(orderId)
      .then((res) => {
        const orderData = res?.order || res;
        if (orderData) setOrder(orderData);
      })
      .catch((err) => {
        console.warn('Order confirmation lookup notice:', err);
      });
  }, [orderId]);

  const displayTotal = order?.total || order?.amount || 0;
  const displayDate = order?.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Today';

  const currentStatus = (order?.status || 'paid').toLowerCase();
  const stages = ['paid', 'production', 'printing', 'dispatched', 'delivered'];
  const currentStageIndex = Math.max(0, stages.indexOf(currentStatus));

  const handleDownloadReceipt = async () => {
    try {
      setIsDownloadingPdf(true);
      await generateOrderReceiptPdf(order || { orderNumber: orderId, total: displayTotal });
    } catch (err) {
      console.error('Invoice download error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-noir-900 py-16 px-4 flex flex-col items-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-sm"
      >
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </motion.div>

      <h1 className="font-serif text-4xl md:text-5xl mb-3 text-center">Order Confirmed!</h1>
      <p className="text-noir-600 mb-10 text-center max-w-md text-sm">
        Thank you for choosing PerfectPic. Your memories are now in our production pipeline at perfectpic.in.
      </p>

      <div className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-sm shadow-sm border border-cream-200 mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm mb-8 pb-8 border-b border-cream-200">
          <div>
            <span className="block text-[11px] text-noir-500 uppercase tracking-widest mb-1">Order ID</span>
            <span className="font-semibold text-noir-950">#{order?.orderNumber || orderId}</span>
          </div>
          <div>
            <span className="block text-[11px] text-noir-500 uppercase tracking-widest mb-1">Date</span>
            <span className="font-semibold text-noir-950">{displayDate}</span>
          </div>
          <div>
            <span className="block text-[11px] text-noir-500 uppercase tracking-widest mb-1">Amount Paid</span>
            <span className="font-semibold text-noir-950">₹{displayTotal.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="block text-[11px] text-noir-500 uppercase tracking-widest mb-1">Pan-India Courier</span>
            <span className="font-semibold text-noir-950">BlueDart Air</span>
          </div>
        </div>

        {/* Timeline Stepper */}
        <div className="relative pt-2">
          <div className="absolute top-6 left-6 right-6 h-[2px] bg-cream-200" />
          <div 
            className="absolute top-6 left-6 h-[2px] bg-noir-950 transition-all duration-500" 
            style={{ width: `${(currentStageIndex / (stages.length - 1)) * 90}%` }}
          />
          
          <div className="flex justify-between relative z-10">
            {['Paid', 'Production', 'Printing', 'Dispatched', 'Delivered'].map((step, i) => {
              const isPastOrCurrent = i <= currentStageIndex;
              return (
                <div key={step} className="flex flex-col items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 bg-white transition-colors ${
                    isPastOrCurrent ? 'border-noir-950 text-noir-950' : 'border-cream-300 text-noir-300'
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${isPastOrCurrent ? 'bg-noir-950' : 'bg-transparent'}`} />
                  </div>
                  <span className={`text-[11px] font-medium uppercase tracking-wider ${
                    isPastOrCurrent ? 'text-noir-950' : 'text-noir-400'
                  }`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={handleDownloadReceipt}
          disabled={isDownloadingPdf}
          className="w-full sm:w-auto px-8 py-3 bg-foil-gold text-noir-950 rounded-sm font-bold text-xs uppercase tracking-widest text-center hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
        >
          {isDownloadingPdf ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Generating Invoice...</span>
            </>
          ) : (
            <>
              <Download size={14} />
              <span>Download PDF Receipt</span>
            </>
          )}
        </button>
        <Link 
          href="/orders" 
          className="w-full sm:w-auto px-8 py-3 bg-noir-950 text-cream-50 rounded-sm font-medium text-xs uppercase tracking-widest text-center hover:bg-noir-900 transition-colors shadow-xs"
        >
          View My Orders
        </Link>
        <Link 
          href="/" 
          className="w-full sm:w-auto px-8 py-3 border border-cream-300 text-noir-900 rounded-sm font-medium text-xs uppercase tracking-widest hover:bg-cream-100 transition-colors text-center"
        >
          Return to Storefront
        </Link>
      </div>
    </div>
  );
}
