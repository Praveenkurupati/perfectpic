// apps/admin/src/app/(dashboard)/marketing/campaigns/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Send, 
  MessageSquare, 
  Mail, 
  Users, 
  Sparkles, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  Smartphone, 
  Monitor, 
  Info,
  RefreshCw
} from "lucide-react";
import { adminApi } from "@/lib/api";

export default function CreateCampaignWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [calculatingAudience, setCalculatingAudience] = useState(false);
  const [testingSend, setTestingSend] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Available fixtures from backend
  const [variables, setVariables] = useState<any[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Identity & Channel
    name: "",
    description: "",
    channel: "email" as "email" | "whatsapp",
    type: "marketing",
    provider: "default",
    rateLimitPerSecond: 20,

    // Step 2: Audience Filter
    audienceFilter: {
      customerSegment: "all",
      registeredWithinDays: undefined as number | undefined,
      hasOrdered: undefined as boolean | undefined,
      orderCountMin: undefined as number | undefined,
      totalSpentMin: undefined as number | undefined,
      lastOrderWithinDays: undefined as number | undefined,
      hasDraftProject: false,
      hasAbandonedProject: false,
      hasPhone: false,
      hasEmail: false,
      respectSuppression: true,
      respectNotificationPreferences: true,
    },

    // Step 3: Template & Content
    templateId: "",
    subject: "A special memory is waiting for you, {{first_name|Friend}} ✨",
    preheader: "Enjoy 15% off your next archival photobook edition.",
    contentHtml: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1c1917; background-color: #faf8f5;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="font-size: 26px; color: #1c1917; margin: 0;">PERFECTPIC</h1>
    <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #b45309; margin-top: 4px;">Archival Photobook Editions</p>
  </div>
  
  <p style="font-size: 16px; line-height: 1.6;">Hello {{first_name|Friend}},</p>
  <p style="font-size: 15px; line-height: 1.6; color: #44403c;">
    Your memories deserve the permanence of archival silver-halide print craft. For a limited time, enjoy an exclusive <strong>{{discount_percent|15%}} off</strong> your next album with promo code <strong>{{discount_code|MEMORIES15}}</strong>.
  </p>
  
  <div style="text-align: center; margin: 32px 0;">
    <a href="https://perfectpic.in/configure?coupon={{discount_code|MEMORIES15}}" style="background-color: #1c1917; color: #fef3c7; padding: 14px 28px; text-decoration: none; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; border-radius: 4px; font-weight: 600; display: inline-block;">
      Create Your Edition &rarr;
    </a>
  </div>
  
  <p style="font-size: 12px; color: #78716c; text-align: center; line-height: 1.5; margin-top: 36px; border-top: 1px solid #e7e5e4; paddingTop: 16px;">
    &copy; {{current_year}} {{company_name}} &middot; <a href="{{unsubscribe_url}}" style="color: #78716c;">Unsubscribe</a>
  </p>
</div>`,
    contentText: "Hello {{first_name|Friend}}, your memories deserve archival print craft. Enjoy 15% off your next album with code {{discount_code|MEMORIES15}}. Create now at https://perfectpic.in",
    whatsappTemplateName: "promotional_discount_v1",
    whatsappLanguageCode: "en_US",

    // Step 4: Dispatch Timing
    scheduleType: "immediate" as "immediate" | "scheduled",
    scheduledAt: "",
  });

  // Audience Count & Preview State
  const [audienceEstimate, setAudienceEstimate] = useState<any>(null);
  const [audiencePreview, setAudiencePreview] = useState<any[]>([]);
  const [showRecipientPreview, setShowRecipientPreview] = useState(false);

  // Preview Mode
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [testRecipient, setTestRecipient] = useState("");

  // Load variable dictionary & templates on mount
  useEffect(() => {
    async function initData() {
      try {
        const [varsRes, tplsRes] = await Promise.all([
          adminApi.getCampaignVariables().catch(() => ({ success: false, variables: [] })),
          adminApi.getCampaignTemplates().catch(() => ({ success: false, templates: [] })),
        ]);
        if (varsRes.success) setVariables(varsRes.variables || []);
        if (tplsRes.success) setAvailableTemplates(tplsRes.templates || []);
      } catch (err) {
        console.error("Init data load failed", err);
      }
    }
    initData();
  }, []);

  // Update audience estimation
  const estimateAudience = async () => {
    setCalculatingAudience(true);
    try {
      const res = await adminApi.estimateAudienceFilter({
        filter: formData.audienceFilter,
        channel: formData.channel,
      });
      if (res.success) {
        setAudienceEstimate(res.result);
      }
    } catch (err) {
      console.error("Failed to estimate audience", err);
    } finally {
      setCalculatingAudience(false);
    }
  };

  const loadAudiencePreview = async () => {
    try {
      const res = await adminApi.previewAudienceFilter({
        filter: formData.audienceFilter,
        channel: formData.channel,
        limit: 5,
      });
      if (res.success) {
        setAudiencePreview(res.preview || []);
        setShowRecipientPreview(true);
      }
    } catch (err) {
      console.error("Failed to preview audience", err);
    }
  };

  // Run initial estimate when entering Step 2
  useEffect(() => {
    if (currentStep === 2 && !audienceEstimate) {
      estimateAudience();
    }
  }, [currentStep]);

  // Insert variable into active editor
  const insertVariable = (key: string) => {
    const token = `{{${key}}}`;
    setFormData(prev => ({
      ...prev,
      contentHtml: prev.contentHtml + ` ${token}`,
      contentText: prev.contentText + ` ${token}`,
    }));
  };

  // Test Send Handler
  const handleTestSend = async () => {
    if (!testRecipient) {
      alert(`Please enter a valid test ${formData.channel === 'email' ? 'email address' : 'WhatsApp phone number'}`);
      return;
    }
    setTestingSend(true);
    setTestResult(null);
    try {
      const res = await adminApi.testSendCampaign({
        channel: formData.channel,
        recipient: testRecipient,
        customContent: {
          subject: formData.subject,
          contentHtml: formData.contentHtml,
          whatsappTemplateName: formData.whatsappTemplateName,
        },
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestingSend(false);
    }
  };

  // Final Campaign Submission
  const handleFinalSubmit = async () => {
    if (!formData.name) {
      alert("Please provide a name for this campaign");
      return;
    }
    setSaving(true);
    try {
      // 1. Create the campaign document
      const payload: any = {
        name: formData.name,
        description: formData.description,
        channel: formData.channel,
        type: formData.type,
        rateLimitPerSecond: Number(formData.rateLimitPerSecond) || 20,
        provider: formData.provider,
        audienceFilter: formData.audienceFilter,
        templateSnapshot: {
          subject: formData.subject,
          preheader: formData.preheader,
          contentHtml: formData.contentHtml,
          contentText: formData.contentText,
          whatsappTemplateName: formData.whatsappTemplateName,
          whatsappLanguageCode: formData.whatsappLanguageCode,
        },
      };

      const createRes = await adminApi.createCampaign(payload);
      if (!createRes.success || !createRes.campaign) {
        throw new Error((createRes as any).error || "Failed to create campaign");
      }

      const campaignId = createRes.campaign.id || createRes.campaign._id;

      // 2. Dispatch or Schedule
      if (formData.scheduleType === "scheduled" && formData.scheduledAt) {
        await adminApi.scheduleCampaign(campaignId, formData.scheduledAt);
      } else {
        await adminApi.launchCampaign(campaignId);
      }

      // 3. Redirect to detail console
      router.push(`/marketing/campaigns/${campaignId}`);
    } catch (err: any) {
      alert(`Launch error: ${err.message}`);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Wizard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
            <Link href="/marketing/campaigns" className="hover:text-white transition">Campaigns</Link>
            <span>/</span>
            <span className="text-zinc-200">New Campaign Wizard</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-serif">Create Mass Communication Campaign</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Build targeting rules, preview personalized templates, and dispatch to customers with controlled throughput.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              onClick={() => step < currentStep && setCurrentStep(step)}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold cursor-pointer transition ${
                currentStep === step
                  ? "bg-foil-gold text-noir-950 ring-2 ring-foil-gold/30"
                  : step < currentStep
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-zinc-900 text-zinc-500 border border-zinc-800"
              }`}
            >
              {step < currentStep ? <Check className="w-4 h-4" /> : step}
            </div>
          ))}
        </div>
      </div>

      {/* ── STEP 1: CAMPAIGN IDENTITY & CHANNEL ─────────────────────────────── */}
      {currentStep === 1 && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 lg:p-8 space-y-6">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-lg font-semibold text-white font-serif">Step 1: Campaign Identity & Channel</h2>
            <p className="text-xs text-zinc-400 mt-1">Specify campaign objectives and choose the broadcast medium.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Campaign Name *</label>
              <input
                type="text"
                placeholder="e.g. Diwali Early Bird 2026 - 20% Off Archival Albums"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-foil-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Description / Internal Goal</label>
              <input
                type="text"
                placeholder="Internal notes on audience target, expected revenue, or conversion targets"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-foil-gold"
              />
            </div>

            {/* Channel Selection */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">Communication Channel *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setFormData({ ...formData, channel: "email" })}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3.5 ${
                    formData.channel === "email"
                      ? "bg-blue-500/10 border-blue-500/50 text-white"
                      : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className={`p-2.5 rounded-lg ${formData.channel === "email" ? "bg-blue-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white">Email Campaign</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Rich HTML styling, dynamic personalization tags, CAN-SPAM one-click unsubscribe links.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, channel: "whatsapp" })}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3.5 ${
                    formData.channel === "whatsapp"
                      ? "bg-emerald-500/10 border-emerald-500/50 text-white"
                      : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className={`p-2.5 rounded-lg ${formData.channel === "whatsapp" ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white">WhatsApp Business</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Direct WhatsApp broadcast via Meta Cloud API v24.0. High open rates with approved templates.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Category & Rate Limit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Campaign Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-foil-gold"
                >
                  <option value="marketing">Promotional / Discount Marketing</option>
                  <option value="retention">Customer Retention & Repeat Order</option>
                  <option value="announcement">New Feature / Product Launch Announcement</option>
                  <option value="transactional">Operational Update</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Dispatch Rate Limit (msgs/sec)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.rateLimitPerSecond}
                  onChange={(e) => setFormData({ ...formData, rateLimitPerSecond: Number(e.target.value) })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-foil-gold"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">Protects sender reputation and conforms to provider burst limits.</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              onClick={() => {
                if (!formData.name.trim()) {
                  alert("Please enter a campaign name");
                  return;
                }
                setCurrentStep(2);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-foil-gold text-noir-950 font-semibold rounded-lg text-sm transition hover:bg-foil-gold/90"
            >
              Continue to Audience Builder <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: AUDIENCE BUILDER & EXCLUSION ENGINE ───────────────────── */}
      {currentStep === 2 && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 lg:p-8 space-y-6">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-lg font-semibold text-white font-serif">Step 2: Audience Filter & Exclusion Engine</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Construct multi-attribute segments across customer lifecycle, purchase history, and photobook activity.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Filter Controls (Left 2 Columns) */}
            <div className="lg:col-span-2 space-y-5">
              {/* Customer Lifecycle Segment Preset */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Lifecycle Segment Preset</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { id: "all", label: "All Customers" },
                    { id: "vip", label: "VIP Buyers" },
                    { id: "active", label: "Active (60d)" },
                    { id: "at_risk", label: "At Risk" },
                    { id: "churned", label: "Churned" },
                    { id: "new", label: "New Users" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        audienceFilter: { ...formData.audienceFilter, customerSegment: s.id }
                      })}
                      className={`px-2.5 py-2 rounded-lg text-xs font-medium transition text-center ${
                        formData.audienceFilter.customerSegment === s.id
                          ? "bg-foil-gold text-noir-950 font-semibold"
                          : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Criteria */}
              <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Order & Commerce Filters</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Has Completed Order</label>
                    <select
                      value={formData.audienceFilter.hasOrdered === undefined ? "any" : formData.audienceFilter.hasOrdered ? "true" : "false"}
                      onChange={(e) => {
                        const val = e.target.value === "any" ? undefined : e.target.value === "true";
                        setFormData({
                          ...formData,
                          audienceFilter: { ...formData.audienceFilter, hasOrdered: val }
                        });
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200"
                    >
                      <option value="any">Any (Buyers + Non-buyers)</option>
                      <option value="true">Must have at least 1 order</option>
                      <option value="false">Never ordered (Zero purchases)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Minimum Total Spent (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={formData.audienceFilter.totalSpentMin || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        audienceFilter: { ...formData.audienceFilter, totalSpentMin: e.target.value ? Number(e.target.value) : undefined }
                      })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Photobook Behavior */}
              <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Photobook Studio Behavior</h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={formData.audienceFilter.hasDraftProject}
                      onChange={(e) => setFormData({
                        ...formData,
                        audienceFilter: { ...formData.audienceFilter, hasDraftProject: e.target.checked }
                      })}
                      className="rounded border-zinc-700 bg-zinc-900 text-foil-gold focus:ring-0"
                    />
                    <span>Has In-Progress Draft Photobook</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={formData.audienceFilter.hasAbandonedProject}
                      onChange={(e) => setFormData({
                        ...formData,
                        audienceFilter: { ...formData.audienceFilter, hasAbandonedProject: e.target.checked }
                      })}
                      className="rounded border-zinc-700 bg-zinc-900 text-foil-gold focus:ring-0"
                    />
                    <span>Has Abandoned Studio Cart (&gt;24h inactive)</span>
                  </label>
                </div>
              </div>

              {/* Compliance & Exclusion Checks */}
              <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-foil-gold" />
                  Compliance & Suppression Guards
                </h4>
                <div className="space-y-2 text-xs text-zinc-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.audienceFilter.respectSuppression}
                      onChange={(e) => setFormData({
                        ...formData,
                        audienceFilter: { ...formData.audienceFilter, respectSuppression: e.target.checked }
                      })}
                      className="rounded border-zinc-700 bg-zinc-900 text-foil-gold focus:ring-0"
                    />
                    <span>Automatically exclude suppressed contacts (Unsubscribed, Bounced, DNC)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.audienceFilter.respectNotificationPreferences}
                      onChange={(e) => setFormData({
                        ...formData,
                        audienceFilter: { ...formData.audienceFilter, respectNotificationPreferences: e.target.checked }
                      })}
                      className="rounded border-zinc-700 bg-zinc-900 text-foil-gold focus:ring-0"
                    />
                    <span>Respect customer notification preferences in account settings</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Audience Calculation Live Breakdown (Right Column) */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <h3 className="font-semibold text-white text-sm">Audience Estimation</h3>
                  <button
                    onClick={estimateAudience}
                    disabled={calculatingAudience}
                    className="flex items-center gap-1.5 text-xs text-foil-gold hover:underline"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${calculatingAudience ? 'animate-spin' : ''}`} />
                    Recalculate
                  </button>
                </div>

                {calculatingAudience ? (
                  <div className="py-12 text-center text-xs text-zinc-500">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-foil-gold" />
                    Calculating matching audience...
                  </div>
                ) : audienceEstimate ? (
                  <div className="mt-4 space-y-4">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center">
                      <span className="text-xs uppercase tracking-wider text-emerald-400 font-medium">Eligible Recipients</span>
                      <div className="text-3xl font-bold text-white font-mono mt-1">
                        {audienceEstimate.eligible.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[11px] text-zinc-400">will receive this campaign</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-zinc-400 py-1 border-b border-zinc-800/60">
                        <span>Total Matched Criteria:</span>
                        <strong className="text-white font-mono">{audienceEstimate.totalMatched}</strong>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400 py-1 border-b border-zinc-800/60">
                        <span>Excluded (Missing Contact):</span>
                        <span className="text-zinc-500 font-mono">-{audienceEstimate.missingContact}</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400 py-1 border-b border-zinc-800/60">
                        <span>Excluded (Suppression / DNC):</span>
                        <span className="text-rose-400 font-mono">-{audienceEstimate.suppressed}</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400 py-1">
                        <span>Excluded (Opted Out):</span>
                        <span className="text-yellow-400 font-mono">-{audienceEstimate.optedOut}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-zinc-500">
                    Click Recalculate to inspect audience count
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={loadAudiencePreview}
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-medium transition"
                >
                  Preview 5 Sample Recipients
                </button>
              </div>
            </div>
          </div>

          {/* Sample Recipient Modal/Expanded View */}
          {showRecipientPreview && audiencePreview.length > 0 && (
            <div className="mt-4 p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Sample Recipient Fixtures</h4>
                <button onClick={() => setShowRecipientPreview(false)} className="text-xs text-zinc-500 hover:text-white">&times; Close</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400">
                      <th className="py-2">Name</th>
                      <th className="py-2">Contact</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Sample Variables Resolved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {audiencePreview.map((r, idx) => (
                      <tr key={idx}>
                        <td className="py-2 text-white font-medium">{r.name}</td>
                        <td className="py-2 font-mono text-zinc-400">{formData.channel === 'email' ? r.email : r.phone}</td>
                        <td className="py-2">
                          {r.isEligible ? (
                            <span className="text-emerald-400 font-medium">Eligible</span>
                          ) : (
                            <span className="text-rose-400 font-medium">{r.ineligibilityReason}</span>
                          )}
                        </td>
                        <td className="py-2 text-zinc-400 font-mono text-[11px]">
                          first_name: &quot;{r.sampleVariables?.first_name}&quot;, discount: &quot;{r.sampleVariables?.discount_code}&quot;
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-zinc-800">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-sm transition"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 px-5 py-2.5 bg-foil-gold text-noir-950 font-semibold rounded-lg text-sm transition hover:bg-foil-gold/90"
            >
              Continue to Template & Message <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: TEMPLATE & DYNAMIC VARIABLES ───────────────────────────── */}
      {currentStep === 3 && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 lg:p-8 space-y-6">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-lg font-semibold text-white font-serif">Step 3: Message Content & Dynamic Variables</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Personalize communication using tokens. Real-time preview ensures zero template variable leaks.
            </p>
          </div>

          {/* Quick Variable Insert Bar */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Insert Dynamic Variable Token:</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: "first_name", label: "First Name" },
                { key: "full_name", label: "Full Name" },
                { key: "order_number", label: "Order Number" },
                { key: "discount_code", label: "Promo Code" },
                { key: "discount_percent", label: "Discount %" },
                { key: "tracking_url", label: "Tracking URL" },
                { key: "project_title", label: "Project Title" },
                { key: "store_credit_balance", label: "Wallet Balance" },
                { key: "unsubscribe_url", label: "Unsubscribe URL" },
              ].map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertVariable(v.key)}
                  className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-foil-gold rounded text-xs font-mono transition"
                >
                  + &#123;&#123;{v.key}&#125;&#125;
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Content Editor Form */}
            <div className="space-y-4">
              {formData.channel === "email" ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Subject Line *</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-foil-gold font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Preheader (Inbox Preview snippet)</label>
                    <input
                      type="text"
                      value={formData.preheader}
                      onChange={(e) => setFormData({ ...formData, preheader: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-foil-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">HTML Content</label>
                    <textarea
                      rows={12}
                      value={formData.contentHtml}
                      onChange={(e) => setFormData({ ...formData, contentHtml: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 font-mono focus:outline-none focus:border-foil-gold"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Meta Approved WhatsApp Template Name *</label>
                    <input
                      type="text"
                      value={formData.whatsappTemplateName}
                      onChange={(e) => setFormData({ ...formData, whatsappTemplateName: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-foil-gold font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Language Code</label>
                    <input
                      type="text"
                      value={formData.whatsappLanguageCode}
                      onChange={(e) => setFormData({ ...formData, whatsappLanguageCode: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-foil-gold font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Message Text / Customer Window Fallback</label>
                    <textarea
                      rows={8}
                      value={formData.contentText}
                      onChange={(e) => setFormData({ ...formData, contentText: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 font-mono focus:outline-none focus:border-foil-gold"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Right: Real-time Device Preview */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-3">
                <span className="text-xs font-medium text-zinc-400">Preview with Test Variables</span>
                <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`p-1.5 rounded ${previewDevice === "desktop" ? "bg-zinc-800 text-white" : "text-zinc-500"}`}
                    title="Desktop Preview"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`p-1.5 rounded ${previewDevice === "mobile" ? "bg-zinc-800 text-white" : "text-zinc-500"}`}
                    title="Mobile Preview"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Render Preview Frame */}
              <div className="flex-1 overflow-y-auto max-h-[460px] flex justify-center items-start">
                {formData.channel === "email" ? (
                  <div className={`w-full bg-white text-zinc-900 rounded-lg shadow-sm border border-zinc-300 overflow-hidden ${
                    previewDevice === "mobile" ? "max-w-[340px]" : "max-w-full"
                  }`}>
                    <div className="bg-zinc-100 p-2.5 border-b border-zinc-200 text-xs">
                      <div className="font-semibold text-zinc-800">
                        {formData.subject.replace(/\{\{first_name(?:\|[^}]+)?\}\}/g, "Aarav")}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate mt-0.5">{formData.preheader}</div>
                    </div>
                    <div
                      className="p-3 text-sm"
                      dangerouslySetInnerHTML={{
                        __html: formData.contentHtml
                          .replace(/\{\{first_name(?:\|[^}]+)?\}\}/g, "Aarav")
                          .replace(/\{\{discount_percent(?:\|[^}]+)?\}\}/g, "15%")
                          .replace(/\{\{discount_code(?:\|[^}]+)?\}\}/g, "MEMORIES15")
                          .replace(/\{\{company_name(?:\|[^}]+)?\}\}/g, "PerfectPic Archival Photobooks")
                          .replace(/\{\{current_year(?:\|[^}]+)?\}\}/g, "2026")
                          .replace(/\{\{unsubscribe_url\}\}/g, "#")
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-[320px] bg-[#0b141a] text-white rounded-2xl p-3 border border-zinc-800 shadow-xl">
                    <div className="bg-[#202c33] p-3 rounded-lg text-xs leading-relaxed text-zinc-200">
                      {formData.contentText
                        .replace(/\{\{first_name(?:\|[^}]+)?\}\}/g, "Aarav")
                        .replace(/\{\{discount_code(?:\|[^}]+)?\}\}/g, "MEMORIES15")}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-zinc-800">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-sm transition"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="flex items-center gap-2 px-5 py-2.5 bg-foil-gold text-noir-950 font-semibold rounded-lg text-sm transition hover:bg-foil-gold/90"
            >
              Continue to Review & Launch <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: REVIEW, TEST SEND & LAUNCH ────────────────────────────── */}
      {currentStep === 4 && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 lg:p-8 space-y-6">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-lg font-semibold text-white font-serif">Step 4: Final Verification, Test Send & Launch</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Verify campaign parameters, send a real test message to your personal device, and launch dispatch.
            </p>
          </div>

          {/* Campaign Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Campaign Parameters</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-900">
                  <span className="text-zinc-500">Name:</span>
                  <span className="text-white font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-900">
                  <span className="text-zinc-500">Channel:</span>
                  <span className="text-white uppercase font-mono">{formData.channel}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-900">
                  <span className="text-zinc-500">Rate Limit:</span>
                  <span className="text-white font-mono">{formData.rateLimitPerSecond} msgs/sec</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Estimated Recipients:</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    {audienceEstimate ? audienceEstimate.eligible.toLocaleString('en-IN') : 'All eligible'}
                  </span>
                </div>
              </div>
            </div>

            {/* Test Send Card */}
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-foil-gold" />
                Live Test Send
              </h4>
              <p className="text-xs text-zinc-400">
                Send a real test message to verify deliverability, rendering, and links on your phone or inbox.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={formData.channel === 'email' ? 'your-email@example.com' : '+91 98765 43210'}
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-foil-gold"
                />
                <button
                  type="button"
                  onClick={handleTestSend}
                  disabled={testingSend}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition flex items-center gap-1"
                >
                  {testingSend ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Send Test
                </button>
              </div>

              {testResult && (
                <div className={`p-2.5 rounded-lg text-xs ${
                  testResult.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {testResult.success ? '✅ Test message dispatched successfully!' : `❌ Test failed: ${testResult.error}`}
                </div>
              )}
            </div>
          </div>

          {/* Schedule or Launch Immediately */}
          <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Dispatch Timing</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setFormData({ ...formData, scheduleType: "immediate" })}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  formData.scheduleType === "immediate"
                    ? "bg-foil-gold/10 border-foil-gold text-white"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${formData.scheduleType === "immediate" ? "text-foil-gold" : "text-zinc-600"}`} />
                  <span className="font-semibold text-sm text-white">Send Immediately</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Initiates automated campaign dispatch immediately. Delivery begins within seconds.
                </p>
              </div>

              <div
                onClick={() => setFormData({ ...formData, scheduleType: "scheduled" })}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  formData.scheduleType === "scheduled"
                    ? "bg-foil-gold/10 border-foil-gold text-white"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${formData.scheduleType === "scheduled" ? "text-foil-gold" : "text-zinc-600"}`} />
                  <span className="font-semibold text-sm text-white">Schedule for Later</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Specify an exact future dispatch time. Messages will be dispatched automatically at the scheduled time.
                </p>
              </div>
            </div>

            {formData.scheduleType === "scheduled" && (
              <div className="pt-2">
                <label className="block text-xs font-medium text-zinc-300 mb-1">Target Dispatch Timestamp</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-foil-gold"
                />
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-zinc-800">
            <button
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-sm transition"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-foil-gold text-noir-950 font-bold rounded-lg text-sm transition hover:bg-foil-gold/90 shadow-md disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Launching Campaign...
                </>
              ) : formData.scheduleType === "scheduled" ? (
                <>
                  <Calendar className="w-4 h-4" />
                  Confirm & Schedule Campaign
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Launch Campaign Now
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
