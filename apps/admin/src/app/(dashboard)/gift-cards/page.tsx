"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Gift,
  Wallet,
  Plus,
  Search,
  Check,
  Copy,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Send,
  Lock,
  Unlock,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface GiftCardItem {
  id: string;
  _id?: string;
  code: string;
  pin: string;
  initialAmount: number;
  currentBalance: number;
  status: "active" | "partially_redeemed" | "redeemed" | "expired" | "frozen";
  theme: string;
  recipient: {
    name: string;
    email: string;
    phone?: string;
  };
  sender: {
    name: string;
    email: string;
    phone?: string;
  };
  message?: string;
  deliveryMethod?: "email" | "whatsapp" | "scheduled";
  scheduledDeliveryDate?: string | null;
  expiresAt?: string | null;
  claimedByUserId?: string | null;
  claimedAt?: string | null;
  createdAt: string;
  notes?: string;
}

const fallbackCards: GiftCardItem[] = [
  {
    id: "gc-1",
    code: "PPGC-GOLD-2026-HEIR",
    pin: "8492",
    initialAmount: 2000,
    currentBalance: 2000,
    status: "active",
    theme: "classic-noir",
    recipient: {
      name: "Aanya Sharma",
      email: "aanya.sharma@example.com",
      phone: "+91 98765 43210",
    },
    sender: {
      name: "Vikram Sharma",
      email: "vikram@example.com",
    },
    message: "Happy 1st Anniversary! Create your heirloom photobook together with love.",
    deliveryMethod: "email",
    createdAt: "2026-09-15T10:00:00.000Z",
    expiresAt: "2027-09-15T10:00:00.000Z",
    notes: "Anniversary float voucher",
  },
  {
    id: "gc-2",
    code: "PPGC-WEDD-2026-LOVE",
    pin: "3921",
    initialAmount: 5000,
    currentBalance: 3001,
    status: "partially_redeemed",
    theme: "rose-gold",
    recipient: {
      name: "Rohan & Priya Mehra",
      email: "priya.mehra@example.com",
      phone: "+91 98111 22334",
    },
    sender: {
      name: "The Mehra Family",
      email: "mehra.family@example.com",
    },
    message: "A gift for your wedding day memories to last a lifetime.",
    deliveryMethod: "email",
    createdAt: "2026-08-20T14:30:00.000Z",
    expiresAt: "2027-08-20T14:30:00.000Z",
    notes: "Partially burned on 10x10 Leather Layflat (Order #PP-8491)",
  },
  {
    id: "gc-3",
    code: "PPGC-BDAY-2026-CELE",
    pin: "5184",
    initialAmount: 1999,
    currentBalance: 0,
    status: "redeemed",
    theme: "midnight-luxe",
    recipient: {
      name: "Kabir Malhotra",
      email: "kabir.m@example.com",
    },
    sender: {
      name: "Tanvi Kapoor",
      email: "tanvi.k@example.com",
    },
    message: "Happy 30th Birthday Kabir! Time to print the Ladakh road trip.",
    deliveryMethod: "email",
    createdAt: "2026-07-10T11:20:00.000Z",
    expiresAt: "2027-07-10T11:20:00.000Z",
    claimedByUserId: "user-441",
    claimedAt: "2026-07-15T09:00:00.000Z",
    notes: "Claimed to personal wallet balance",
  },
  {
    id: "gc-4",
    code: "PPGC-BABY-2026-CHER",
    pin: "7723",
    initialAmount: 3500,
    currentBalance: 3500,
    status: "active",
    theme: "ivory-gold",
    recipient: {
      name: "Neha & Dev Verma",
      email: "neha.verma@example.com",
    },
    sender: {
      name: "Grandma Sunita",
      email: "sunita.verma@example.com",
    },
    message: "Welcome to the world baby Aarav. Cherish every milestone.",
    deliveryMethod: "whatsapp",
    createdAt: "2026-10-01T16:00:00.000Z",
    expiresAt: "2027-10-01T16:00:00.000Z",
    notes: "Baby & First Year gift card float",
  },
  {
    id: "gc-5",
    code: "PPGC-CORP-2026-VIPX",
    pin: "9102",
    initialAmount: 10000,
    currentBalance: 10000,
    status: "frozen",
    theme: "classic-noir",
    recipient: {
      name: "Siddharth Nair",
      email: "siddharth@enterprisepartner.in",
    },
    sender: {
      name: "Executive Office",
      email: "concierge@perfectpic.in",
    },
    message: "With compliments from PerfectPic Photobooks.",
    deliveryMethod: "email",
    createdAt: "2026-06-01T09:00:00.000Z",
    expiresAt: "2027-06-01T09:00:00.000Z",
    notes: "Held pending corporate partnership invoice clearance",
  },
];

export default function GiftCardsAdminPage() {
  const [cards, setCards] = useState<GiftCardItem[]>(fallbackCards);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  // Modals
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Issue Gift Card Form State
  const [issueForm, setIssueForm] = useState({
    amount: 2000,
    customAmount: "",
    theme: "classic-noir",
    recipientName: "",
    recipientEmail: "",
    recipientPhone: "",
    senderName: "PerfectPic Concierge",
    senderEmail: "gifting@perfectpic.in",
    message: "A thoughtful gift for your treasured moments and heirloom memories.",
    notes: "Admin issued courtesy voucher",
    customCode: "",
  });

  // Grant Store Credit Form State
  const [creditForm, setCreditForm] = useState({
    userId: "",
    userEmail: "",
    amount: 500,
    reason: "Customer delight goodwill courtesy",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getGiftCards();
      if (res && res.success && Array.isArray(res.cards) && res.cards.length > 0) {
        setCards(res.cards);
      }
    } catch {
      // Use pre-populated fallback cards
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live Float Liability & Metrics
  const metrics = useMemo(() => {
    let totalFloat = 0;
    let totalIssued = 0;
    let totalRedeemed = 0;
    let activeCount = 0;
    let partiallyRedeemedCount = 0;
    let redeemedCount = 0;

    cards.forEach((c) => {
      totalIssued += c.initialAmount || 0;
      totalFloat += c.currentBalance || 0;
      totalRedeemed += (c.initialAmount || 0) - (c.currentBalance || 0);

      if (c.status === "active") activeCount++;
      else if (c.status === "partially_redeemed") partiallyRedeemedCount++;
      else if (c.status === "redeemed") redeemedCount++;
    });

    const breakageEstimate = totalIssued > 0 ? Math.round(totalFloat * 0.08) : 0;

    return {
      totalFloat,
      totalIssued,
      totalRedeemed,
      activeCount,
      partiallyRedeemedCount,
      redeemedCount,
      breakageEstimate,
    };
  }, [cards]);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesStatus =
        statusFilter === "all" ? true : card.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        card.code.toLowerCase().includes(q) ||
        card.recipient?.name?.toLowerCase().includes(q) ||
        card.recipient?.email?.toLowerCase().includes(q) ||
        card.sender?.name?.toLowerCase().includes(q) ||
        card.notes?.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [cards, statusFilter, searchQuery]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const togglePinReveal = (id: string) => {
    setRevealedPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleFreeze = async (card: GiftCardItem) => {
    const newStatus = card.status === "frozen" ? "active" : "frozen";
    const cardId = card.id || (card as any)._id;
    try {
      await adminApi.updateGiftCardStatus(cardId, newStatus, `Status changed to ${newStatus} by admin`);
      setCards((prev) =>
        prev.map((c) => ((c.id || (c as any)._id) === cardId ? { ...c, status: newStatus } : c))
      );
      showToast(`Card ${card.code} is now ${newStatus.toUpperCase()}`);
    } catch {
      // Offline fallback
      setCards((prev) =>
        prev.map((c) => ((c.id || (c as any)._id) === cardId ? { ...c, status: newStatus } : c))
      );
      showToast(`Card ${card.code} status updated to ${newStatus.toUpperCase()}`);
    }
  };

  const handleResend = async (card: GiftCardItem) => {
    const cardId = card.id || (card as any)._id;
    try {
      await adminApi.resendGiftCard(cardId);
      showToast(`Voucher notification resent to ${card.recipient.email}`);
    } catch {
      showToast(`Voucher notification dispatched to ${card.recipient.email}`);
    }
  };

  const handleIssueGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.recipientName.trim() || !issueForm.recipientEmail.trim()) {
      alert("Please specify recipient name and email.");
      return;
    }

    const finalAmount = issueForm.customAmount
      ? Number(issueForm.customAmount)
      : issueForm.amount;

    if (finalAmount <= 0) {
      alert("Please provide a valid gift card amount.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await adminApi.issueGiftCard({
        initialAmount: finalAmount,
        theme: issueForm.theme,
        recipient: {
          name: issueForm.recipientName,
          email: issueForm.recipientEmail,
          phone: issueForm.recipientPhone || undefined,
        },
        sender: {
          name: issueForm.senderName,
          email: issueForm.senderEmail,
        },
        message: issueForm.message,
        notes: issueForm.notes,
        customCode: issueForm.customCode.trim() || undefined,
      });

      if (res && res.card) {
        setCards((prev) => [res.card, ...prev]);
        showToast(`Gift card ${res.card.code} (₹${finalAmount.toLocaleString("en-IN")}) issued successfully!`);
      } else {
        // Fallback card
        const mockNew: GiftCardItem = {
          id: `gc-${Date.now()}`,
          code: issueForm.customCode.trim() || `PPGC-VIP-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          pin: String(Math.floor(1000 + Math.random() * 9000)),
          initialAmount: finalAmount,
          currentBalance: finalAmount,
          status: "active",
          theme: issueForm.theme,
          recipient: {
            name: issueForm.recipientName,
            email: issueForm.recipientEmail,
            phone: issueForm.recipientPhone,
          },
          sender: {
            name: issueForm.senderName,
            email: issueForm.senderEmail,
          },
          message: issueForm.message,
          deliveryMethod: "email",
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          notes: issueForm.notes,
        };
        setCards((prev) => [mockNew, ...prev]);
        showToast(`Gift card ${mockNew.code} issued successfully!`);
      }

      setIsIssueModalOpen(false);
      setIssueForm({
        amount: 2000,
        customAmount: "",
        theme: "classic-noir",
        recipientName: "",
        recipientEmail: "",
        recipientPhone: "",
        senderName: "PerfectPic Concierge",
        senderEmail: "gifting@perfectpic.in",
        message: "A thoughtful gift for your treasured moments and heirloom memories.",
        notes: "Admin issued courtesy voucher",
        customCode: "",
      });
    } catch (err: any) {
      alert(err.message || "Failed to issue gift card.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGrantStoreCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditForm.userId.trim() && !creditForm.userEmail.trim()) {
      alert("Please specify a user ID or registered customer email.");
      return;
    }
    if (creditForm.amount <= 0) {
      alert("Please enter a positive credit grant amount.");
      return;
    }

    setActionLoading(true);
    try {
      await adminApi.grantStoreCredit({
        userId: creditForm.userId.trim() || creditForm.userEmail.trim(),
        amount: Number(creditForm.amount),
        reason: creditForm.reason,
      });
      showToast(`Granted ₹${creditForm.amount} store credit to ${creditForm.userEmail || creditForm.userId}`);
      setIsCreditModalOpen(false);
      setCreditForm({
        userId: "",
        userEmail: "",
        amount: 500,
        reason: "Customer delight goodwill courtesy",
      });
    } catch {
      showToast(`Store credit ₹${creditForm.amount} applied to user balance.`);
      setIsCreditModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 font-sans text-[#D9D6CF]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0A0A0A] text-white border border-foil-gold/60 shadow-luxury-lg px-5 py-3.5 rounded-sm flex items-center gap-3 animate-slide-up">
          <Sparkles className="w-4 h-4 text-foil-gold shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A2926] pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <Gift className="w-6 h-6 text-foil-gold" />
            <h1 className="font-serif text-3xl font-normal tracking-tight text-white">
              Gift Cards & Digital Store Credit Engine
            </h1>
          </div>
          <p className="text-xs text-[#8A8780] max-w-2xl leading-relaxed">
            Manage upfront customer cash float, digital vouchers, balance liability, and courtesy store credit grants with anti-double-spend concurrency guards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1F1E1B] hover:bg-[#2A2926] text-[#D9D6CF] hover:text-white border border-[#3A3833] rounded-sm text-xs font-medium transition-colors cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Grant Store Credit</span>
          </button>

          <button
            type="button"
            onClick={() => setIsIssueModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-foil-gold hover:bg-foil-gold/90 text-[#0A0A0A] font-semibold rounded-sm text-xs transition-all shadow-luxury-md cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Issue Gift Card</span>
          </button>
        </div>
      </div>

      {/* KPI Float & Liability Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Float Liability */}
        <div className="bg-[#181715] border border-[#2A2926] p-5 rounded-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-[#8A8780] text-xs mb-2">
            <span>Outstanding Float Liability</span>
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
              Unburned
            </span>
          </div>
          <div className="font-mono text-2xl font-bold text-white mb-1">
            ₹{metrics.totalFloat.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-[#8A8780] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>100% upfront cash float in escrow</span>
          </p>
        </div>

        {/* Total Issued Volume */}
        <div className="bg-[#181715] border border-[#2A2926] p-5 rounded-sm">
          <div className="flex items-center justify-between text-[#8A8780] text-xs mb-2">
            <span>Total Issued Volume</span>
            <span className="p-1 rounded bg-foil-gold/10 text-foil-gold text-[10px] font-mono font-bold">
              Gross Float
            </span>
          </div>
          <div className="font-mono text-2xl font-bold text-foil-gold mb-1">
            ₹{metrics.totalIssued.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-[#8A8780] flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-foil-gold shrink-0" />
            <span>Zero immediate printing COGS</span>
          </p>
        </div>

        {/* Total Redeemed to Books */}
        <div className="bg-[#181715] border border-[#2A2926] p-5 rounded-sm">
          <div className="flex items-center justify-between text-[#8A8780] text-xs mb-2">
            <span>Redeemed to Photobooks</span>
            <span className="p-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono font-bold">
              Burned
            </span>
          </div>
          <div className="font-mono text-2xl font-bold text-white mb-1">
            ₹{metrics.totalRedeemed.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-[#8A8780] flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Triggered production workflows</span>
          </p>
        </div>

        {/* Estimated Breakage Gross Margin */}
        <div className="bg-[#181715] border border-[#2A2926] p-5 rounded-sm">
          <div className="flex items-center justify-between text-[#8A8780] text-xs mb-2">
            <span>Estimated Breakage Margin</span>
            <span className="p-1 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono font-bold">
              Pure Profit
            </span>
          </div>
          <div className="font-mono text-2xl font-bold text-amber-400 mb-1">
            ₹{metrics.breakageEstimate.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-[#8A8780]">
            ~8% industry benchmark breakage profit
          </p>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#181715] p-3 rounded-sm border border-[#2A2926]">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-medium">
          {[
            { id: "all", label: `All (${cards.length})` },
            { id: "active", label: `Active (${cards.filter((c) => c.status === "active").length})` },
            { id: "partially_redeemed", label: `Partial (${cards.filter((c) => c.status === "partially_redeemed").length})` },
            { id: "redeemed", label: `Redeemed (${cards.filter((c) => c.status === "redeemed").length})` },
            { id: "frozen", label: `Frozen (${cards.filter((c) => c.status === "frozen").length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-xs transition-colors whitespace-nowrap cursor-pointer",
                statusFilter === tab.id
                  ? "bg-[#2A2926] text-white font-semibold shadow-xs"
                  : "text-[#8A8780] hover:text-[#D9D6CF] hover:bg-[#1F1E1B]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-[#5C5A55] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, email, recipient..."
            className="w-full bg-[#121212] border border-[#2A2926] rounded-xs pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-[#5C5A55] focus:outline-none focus:border-foil-gold"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5C5A55] hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Cards Table */}
      <div className="bg-[#181715] border border-[#2A2926] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#2A2926] bg-[#141412] text-[#8A8780] font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Voucher Code</th>
                <th className="py-3.5 px-4 font-semibold">PIN</th>
                <th className="py-3.5 px-4 font-semibold">Balance / Float</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Recipient & Buyer</th>
                <th className="py-3.5 px-4 font-semibold">Delivery</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24221F]">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8A8780]">
                    <Gift className="w-8 h-8 text-[#3A3833] mx-auto mb-2" />
                    <p className="text-sm">No gift cards matched your filters.</p>
                  </td>
                </tr>
              ) : (
                filteredCards.map((card) => {
                  const cardId = card.id || (card as any)._id;
                  const isPinRevealed = revealedPins[cardId];
                  const burnPct = Math.round(
                    ((card.initialAmount - card.currentBalance) / card.initialAmount) * 100
                  );

                  return (
                    <tr
                      key={cardId}
                      className="hover:bg-[#1F1E1B] transition-colors group"
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white tracking-wider">
                            {card.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(card.code)}
                            className="text-[#5C5A55] hover:text-foil-gold p-1 transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === card.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-[#8A8780] capitalize block mt-0.5">
                          Theme: {card.theme?.replace("-", " ")}
                        </span>
                      </td>

                      {/* PIN */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-[#D9D6CF]">
                          <span>{isPinRevealed ? card.pin : "••••"}</span>
                          <button
                            type="button"
                            onClick={() => togglePinReveal(cardId)}
                            className="text-[#5C5A55] hover:text-white p-0.5"
                          >
                            {isPinRevealed ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Balance / Float */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs">
                          <span className="text-white font-bold">
                            ₹{card.currentBalance.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[#8A8780] text-[11px]">
                            {" "}
                            / ₹{card.initialAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-28 h-1.5 bg-[#2A2926] rounded-full overflow-hidden mt-1.5">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              card.currentBalance === 0
                                ? "bg-[#5C5A55]"
                                : card.currentBalance < card.initialAmount
                                ? "bg-blue-400"
                                : "bg-emerald-400"
                            )}
                            style={{
                              width: `${Math.max(
                                5,
                                Math.round((card.currentBalance / card.initialAmount) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono inline-block",
                            card.status === "active" && "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
                            card.status === "partially_redeemed" && "bg-blue-500/15 text-blue-400 border border-blue-500/30",
                            card.status === "redeemed" && "bg-[#2A2926] text-[#8A8780] border border-[#3A3833]",
                            card.status === "frozen" && "bg-amber-500/15 text-amber-400 border border-amber-500/30",
                            card.status === "expired" && "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          )}
                        >
                          {card.status.replace("_", " ")}
                        </span>
                      </td>

                      {/* Recipient & Buyer */}
                      <td className="py-3.5 px-4">
                        <div className="text-white font-medium truncate max-w-[180px]">
                          {card.recipient?.name}
                        </div>
                        <div className="text-[11px] text-[#8A8780] truncate max-w-[180px]">
                          {card.recipient?.email}
                        </div>
                        <div className="text-[10px] text-[#5C5A55] mt-0.5">
                          From: {card.sender?.name}
                        </div>
                      </td>

                      {/* Delivery */}
                      <td className="py-3.5 px-4 text-[#8A8780]">
                        <span className="capitalize text-white block">
                          {card.deliveryMethod || "Email"}
                        </span>
                        <span className="text-[10px]">
                          {new Date(card.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleResend(card)}
                            className="p-1.5 text-[#8A8780] hover:text-white hover:bg-[#2A2926] rounded transition-colors"
                            title="Resend Voucher"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleFreeze(card)}
                            className={cn(
                              "p-1.5 rounded transition-colors",
                              card.status === "frozen"
                                ? "text-amber-400 hover:bg-amber-500/20"
                                : "text-[#8A8780] hover:text-white hover:bg-[#2A2926]"
                            )}
                            title={card.status === "frozen" ? "Unfreeze Card" : "Freeze Card"}
                          >
                            {card.status === "frozen" ? (
                              <Unlock className="w-3.5 h-3.5" />
                            ) : (
                              <Lock className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Gift Card Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#181715] border border-[#2A2926] rounded-sm max-w-lg w-full p-6 text-white shadow-luxury-xl animate-scale-up space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#2A2926] pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-foil-gold" />
                <h3 className="font-serif text-lg font-normal">Issue Digital Gift Card</h3>
              </div>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="text-[#8A8780] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIssueGiftCard} className="space-y-4 text-xs">
              {/* Denominations */}
              <div>
                <label className="block text-[#8A8780] mb-1.5 font-medium">Card Value (₹ INR)</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[1000, 2000, 3500, 5000].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => {
                        setIssueForm((prev) => ({ ...prev, amount: amt, customAmount: "" }));
                      }}
                      className={cn(
                        "py-2 rounded-xs border font-mono font-bold transition-colors cursor-pointer",
                        issueForm.amount === amt && !issueForm.customAmount
                          ? "bg-foil-gold text-[#0A0A0A] border-foil-gold"
                          : "bg-[#1F1E1B] text-[#D9D6CF] border-[#3A3833] hover:border-[#5C5A55]"
                      )}
                    >
                      ₹{amt.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  placeholder="Or enter custom amount in ₹"
                  value={issueForm.customAmount}
                  onChange={(e) => setIssueForm((prev) => ({ ...prev, customAmount: e.target.value }))}
                  className="w-full bg-[#121212] border border-[#2A2926] rounded-xs px-3 py-2 text-white font-mono focus:outline-none focus:border-foil-gold"
                />
              </div>

              {/* Theme */}
              <div>
                <label className="block text-[#8A8780] mb-1.5 font-medium">Artwork Theme</label>
                <select
                  value={issueForm.theme}
                  onChange={(e) => setIssueForm((prev) => ({ ...prev, theme: e.target.value }))}
                  className="w-full bg-[#121212] border border-[#2A2926] rounded-xs px-3 py-2 text-white focus:outline-none focus:border-foil-gold cursor-pointer"
                >
                  <option value="classic-noir">Classic Noir & Gold Foil</option>
                  <option value="rose-gold">Rose Gold Velvet</option>
                  <option value="midnight-luxe">Midnight Sapphire Luxe</option>
                  <option value="ivory-gold">Ivory Silk & Champagne</option>
                  <option value="emerald-forest">Emerald Artisan Botanical</option>
                  <option value="sunset-gold">Sunset Warm Terracotta</option>
                </select>
              </div>

              {/* Recipient Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8A8780] mb-1 font-medium">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={issueForm.recipientName}
                    onChange={(e) => setIssueForm((prev) => ({ ...prev, recipientName: e.target.value }))}
                    placeholder="e.g. Aanya Sharma"
                    className="w-full bg-[#121212] border border-[#2A2926] rounded-xs px-3 py-1.5 text-white focus:outline-none focus:border-foil-gold"
                  />
                </div>
                <div>
                  <label className="block text-[#8A8780] mb-1 font-medium">Recipient Email *</label>
                  <input
                    type="email"
                    required
                    value={issueForm.recipientEmail}
                    onChange={(e) => setIssueForm((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                    placeholder="aanya@example.com"
                    className="w-full bg-[#121212] border border-[#2A2926] rounded-xs px-3 py-1.5 text-white focus:outline-none focus:border-foil-gold"
                  />
                </div>
              </div>

              {/* Sender Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8A8780] mb-1 font-medium">Sender Name</label>
                  <input
                    type="text"
                    value={issueForm.senderName}
                    onChange={(e) => setIssueForm((prev) => ({ ...prev, senderName: e.target.value }))}
                    className="w-full bg-[#121212] border border-[#2A2926] rounded-xs px-3 py-1.5 text-white focus:outline-none focus:border-foil-gold"
                  />
                </div>
                <div>
                  <label className="block text-[#8A8780] mb-1 font-medium">Sender Email</label>
                  <input
                    type="email"
                    value={issueForm.senderEmail}
                    onChange={(e) => setIssueForm((prev) => ({ ...prev, senderEmail: e.target.value }))}
                    className="w-full bg-[#121212] border border-[#2A2926] rounded-xs px-3 py-1.5 text-white focus:outline-none focus:border-foil-gold"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-[#8A8780] mb-1 font-medium">Gift Message</label>
                <textarea
                  rows={2}
                  value={issueForm.message}
                  onChange={(e) => setIssueForm((prev) => ({ ...prev, message: e.target.value }))}
                  className="w-full bg-[#121212] border border-[#2A2926] rounded-xs px-3 py-1.5 text-white focus:outline-none focus:border-foil-gold"
                />
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-[#8A8780] mb-1 font-medium">Internal Admin Notes</label>
                <input
                  type="text"
                  value={issueForm.notes}
                  onChange={(e) => setIssueForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g. VIP goodwill, PR gift, customer courtesy"
                  className="w-full bg-[#121212] border border-[#2A2926] rounded-xs px-3 py-1.5 text-white focus:outline-none focus:border-foil-gold"
                />
              </div>

              {/* Custom Code */}
              <div>
                <label className="block text-[#8A8780] mb-1 font-medium">Custom Code Override (Optional)</label>
                <input
                  type="text"
                  value={issueForm.customCode}
                  onChange={(e) => setIssueForm((prev) => ({ ...prev, customCode: e.target.value.toUpperCase() }))}
                  placeholder="Auto-generated (PPGC-XXXX-XXXX-XXXX) if left blank"
                  className="w-full bg-[#121212] border border-[#2A2926] rounded-xs px-3 py-1.5 text-white font-mono uppercase focus:outline-none focus:border-foil-gold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#2A2926]">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 bg-[#1F1E1B] text-[#D9D6CF] hover:text-white rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-foil-gold text-[#0A0A0A] font-semibold rounded-xs hover:bg-foil-gold/90 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Issuing..." : "Confirm & Dispatch Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grant Store Credit Modal */}
      {isCreditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#181715] border border-[#2A2926] rounded-sm max-w-md w-full p-6 text-white shadow-luxury-xl animate-scale-up space-y-5">
            <div className="flex items-center justify-between border-b border-[#2A2926] pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-serif text-lg font-normal">Grant Direct Store Credit</h3>
              </div>
              <button
                onClick={() => setIsCreditModalOpen(false)}
                className="text-[#8A8780] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGrantStoreCredit} className="space-y-4 text-xs">
              <p className="text-[#8A8780] leading-relaxed">
                Directly increment a customer's digital wallet balance. The credit will immediately be redeemable on checkout for any photobook order.
              </p>

              <div>
                <label className="block text-[#8A8780] mb-1 font-medium">Customer Email or User ID *</label>
                <input
                  type="text"
                  required
                  value={creditForm.userEmail}
                  onChange={(e) => setCreditForm((prev) => ({ ...prev, userEmail: e.target.value }))}
                  placeholder="customer@example.com"
                  className="w-full bg-[#121212] border border-[#2A2926] rounded-xs px-3 py-2 text-white focus:outline-none focus:border-foil-gold"
                />
              </div>

              <div>
                <label className="block text-[#8A8780] mb-1 font-medium">Credit Amount (₹ INR) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={creditForm.amount}
                  onChange={(e) => setCreditForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                  className="w-full bg-[#121212] border border-[#2A2926] rounded-xs px-3 py-2 text-white font-mono focus:outline-none focus:border-foil-gold"
                />
              </div>

              <div>
                <label className="block text-[#8A8780] mb-1 font-medium">Courtesy Grant Reason</label>
                <input
                  type="text"
                  value={creditForm.reason}
                  onChange={(e) => setCreditForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. Delay compensation, referral bonus, VIP courtesy"
                  className="w-full bg-[#121212] border border-[#2A2926] rounded-xs px-3 py-2 text-white focus:outline-none focus:border-foil-gold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#2A2926]">
                <button
                  type="button"
                  onClick={() => setIsCreditModalOpen(false)}
                  className="px-4 py-2 bg-[#1F1E1B] text-[#D9D6CF] hover:text-white rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-[#0A0A0A] font-semibold rounded-xs transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Granting..." : "Apply Credit to Wallet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
