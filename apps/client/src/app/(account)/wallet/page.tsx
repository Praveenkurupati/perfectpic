// apps/client/src/app/(account)/wallet/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Wallet, 
  Gift, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Copy, 
  Plus, 
  Loader2, 
  AlertCircle,
  BookOpen,
  X
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

interface LedgerItem {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId?: string;
  description: string;
  createdAt: string;
}

export default function WalletPage() {
  const { user, isAuthenticated, initialize } = useAuthStore();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Claim Gift Card Modal State
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimCode, setClaimCode] = useState('');
  const [claimPin, setClaimPin] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimSuccessMsg, setClaimSuccessMsg] = useState('');

  // Filter Tabs
  const [activeTab, setActiveTab] = useState<'all' | 'credits' | 'debits'>('all');

  useEffect(() => {
    initialize();
  }, [initialize]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const res = await api.getWalletBalance();
      if (res && res.success) {
        setBalance(res.balance || 0);
        setTransactions(res.transactions || []);
      }
    } catch {
      // Fallback demo balance for offline/guest dev
      setBalance(2500);
      setTransactions([
        {
          id: 'demo-tx-1',
          type: 'gift_card_claim',
          amount: 2500,
          balanceBefore: 0,
          balanceAfter: 2500,
          referenceId: 'PPGC-GOLD-2026-HEIR',
          description: 'Redeemed Gift Card PPGC-GOLD-2026-HEIR',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError('');
    setClaimSuccessMsg('');

    if (!claimCode.trim()) {
      setClaimError('Please enter your gift card code.');
      return;
    }

    setClaimLoading(true);
    try {
      const res = await api.claimGiftCard(claimCode.trim(), claimPin.trim());
      if (res && res.success) {
        setClaimSuccessMsg(res.message || `Successfully claimed ₹${res.claimedAmount}!`);
        setBalance(res.newBalance);
        setClaimCode('');
        setClaimPin('');
        // Reload transactions
        loadWalletData();
        setTimeout(() => {
          setIsClaimModalOpen(false);
          setClaimSuccessMsg('');
        }, 2000);
      }
    } catch (err: any) {
      setClaimError(err.message || 'Failed to claim gift card. Please verify code and PIN.');
    } finally {
      setClaimLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (activeTab === 'credits') return t.amount > 0;
    if (activeTab === 'debits') return t.amount < 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#121212] pt-28 pb-20">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl">
        {/* Breadcrumb & Header */}
        <div className="mb-8 md:mb-10">
          <div className="flex items-center gap-2 text-xs text-noir-500 mb-2">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <Link href="/orders" className="hover:underline">Account</Link>
            <span>/</span>
            <span className="text-noir-900 font-medium">Digital Wallet</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-noir-950">
                Store Credit &amp; Wallet
              </h1>
              <p className="text-xs sm:text-sm text-noir-600 mt-1">
                Manage your digital balance, claim gift cards, and track heirloom photobook credits.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setClaimError('');
                  setClaimSuccessMsg('');
                  setIsClaimModalOpen(true);
                }}
                className="px-4 py-2.5 bg-noir-950 hover:bg-noir-900 text-cream-50 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Claim Gift Card</span>
              </button>

              <Link
                href="/gift-cards"
                className="px-4 py-2.5 bg-white border border-cream-300 hover:bg-cream-50 text-noir-800 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Gift className="w-3.5 h-3.5 text-amber-700" />
                <span>Send a Gift Card</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Balance Card Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Main Gold Balance Card */}
          <div className="md:col-span-2 bg-gradient-to-br from-[#1C1A17] via-[#12110F] to-[#0A0A0A] rounded-2xl p-7 md:p-8 text-white border border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-between">
            {/* Shimmer background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold flex items-center gap-1.5">
                  <Wallet className="w-4 h-4" />
                  <span>Available Store Credit</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-cream-300">
                  Instant Checkout Auto-Apply
                </span>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                  <span className="text-xs text-cream-300">Fetching live balance...</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="font-serif text-4xl md:text-5xl font-bold font-mono tracking-tight text-cream-50">
                    ₹{balance.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-cream-400 font-mono">INR</span>
                </div>
              )}

              <p className="text-xs text-cream-300/80 leading-relaxed max-w-lg mt-2">
                Your store credit is automatically deducted from any photobook order at checkout. If your order total is less than your credit, zero external payment is needed.
              </p>
            </div>

            <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 mt-6">
              <span className="text-[11px] text-cream-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Protected by RBI compliant 1-year float security</span>
              </span>

              <Link
                href="/configure"
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-noir-950 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1"
              >
                <span>Create Book &amp; Spend</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Gift Card Info Side Card */}
          <div className="bg-white rounded-2xl p-6 border border-cream-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-4">
                <Gift className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-noir-950 mb-1">
                How It Works
              </h3>
              <ul className="space-y-2.5 text-xs text-noir-600 mt-3 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cream-200 text-noir-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                  <span>Enter the 16-character code and PIN from your digital voucher.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cream-200 text-noir-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                  <span>Balance is permanently credited to your personal account.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cream-200 text-noir-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                  <span>Deducted automatically on your next checkout.</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setIsClaimModalOpen(true)}
              className="w-full mt-6 py-2.5 bg-cream-100 hover:bg-cream-200 text-noir-900 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors text-center"
            >
              Enter Code Now
            </button>
          </div>
        </div>

        {/* Transaction History Ledger */}
        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-noir-950">
                Transaction Ledger
              </h2>
              <p className="text-xs text-noir-500 mt-0.5">
                Every credit and debit is immutably logged for complete audit transparency.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-cream-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white text-noir-950 shadow-xs'
                    : 'text-noir-600 hover:text-noir-900'
                }`}
              >
                All ({transactions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('credits')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'credits'
                    ? 'bg-white text-noir-950 shadow-xs'
                    : 'text-noir-600 hover:text-noir-900'
                }`}
              >
                Credits
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('debits')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'debits'
                    ? 'bg-white text-noir-950 shadow-xs'
                    : 'text-noir-600 hover:text-noir-900'
                }`}
              >
                Redemptions
              </button>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-noir-500">
              <Wallet className="w-8 h-8 text-cream-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-noir-700">No transactions found</p>
              <p className="text-xs text-noir-500 mt-1 max-w-sm mx-auto">
                Redeem a gift card above or use store credits during checkout to see your activity here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-cream-200 bg-cream-50/50 text-[11px] font-semibold uppercase tracking-wider text-noir-600">
                    <th className="p-4">Date &amp; Time</th>
                    <th className="p-4">Transaction Details</th>
                    <th className="p-4">Reference</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4 text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100 text-xs">
                  {filteredTransactions.map((tx) => {
                    const isCredit = tx.amount > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-cream-50/50 transition-colors">
                        <td className="p-4 whitespace-nowrap text-noir-500 font-mono">
                          {new Date(tx.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                isCredit
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-noir-100 text-noir-800'
                              }`}
                            >
                              {isCredit ? (
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div>
                              <span className="font-semibold text-noir-900 block">
                                {tx.description}
                              </span>
                              <span className="text-[10px] text-noir-500 uppercase tracking-wider">
                                {tx.type.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 font-mono text-noir-600">
                          {tx.referenceId ? (
                            <span className="bg-cream-100 px-2 py-0.5 rounded text-[11px]">
                              {tx.referenceId}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        <td
                          className={`p-4 text-right font-mono font-bold whitespace-nowrap ${
                            isCredit ? 'text-emerald-700' : 'text-noir-900'
                          }`}
                        >
                          {isCredit ? `+₹${tx.amount.toLocaleString('en-IN')}` : `-₹${Math.abs(tx.amount).toLocaleString('en-IN')}`}
                        </td>

                        <td className="p-4 text-right font-mono text-noir-600 whitespace-nowrap">
                          ₹{tx.balanceAfter.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Claim Gift Card Modal */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 bg-noir-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-cream-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsClaimModalOpen(false)}
              className="absolute top-4 right-4 text-noir-400 hover:text-noir-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-4">
              <Gift className="w-5 h-5" />
            </div>

            <h3 className="font-serif text-xl font-bold text-noir-950 mb-1">
              Redeem a Gift Card
            </h3>
            <p className="text-xs text-noir-600 mb-6">
              Enter the voucher code and security PIN from your email or gift card to credit your balance.
            </p>

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-noir-700 uppercase tracking-wider mb-1">
                  Gift Card Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PPGC-8K92-M3X7-9104"
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-cream-300 text-sm font-mono tracking-wider focus:outline-none focus:border-noir-950 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-noir-700 uppercase tracking-wider mb-1">
                  4-Digit Security PIN *
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  placeholder="••••"
                  value={claimPin}
                  onChange={(e) => setClaimPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-cream-300 text-sm font-mono tracking-widest focus:outline-none focus:border-noir-950"
                />
              </div>

              {claimError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{claimError}</span>
                </div>
              )}

              {claimSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{claimSuccessMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={claimLoading}
                className="w-full mt-2 py-3 bg-noir-950 hover:bg-noir-900 text-cream-50 rounded-xl text-xs font-semibold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {claimLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Voucher...</span>
                  </>
                ) : (
                  <span>Claim to Wallet Balance</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
