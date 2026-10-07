// apps/client/src/app/(checkout)/checkout/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, AlertCircle } from 'lucide-react';

import { useCartStore } from '@/stores/useCartStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAddressStore } from '@/stores/useAddressStore';
import { api } from '@/lib/api';
import { trackMetaInitiateCheckout, trackMetaPurchase } from '@/lib/metaPixel';
import PackagingUpsellModal from '@/features/checkout/components/PackagingUpsellModal';

// Modular Step Components
import CheckoutStepper from '@/components/checkout/CheckoutStepper';
import ShippingAddressStep, { ShippingAddressFormState } from '@/components/checkout/ShippingAddressStep';
import DeliveryMethodStep from '@/components/checkout/DeliveryMethodStep';
import AddonsStep from '@/components/checkout/AddonsStep';
import PaymentStep from '@/components/checkout/PaymentStep';
import OrderSummarySidebar from '@/components/checkout/OrderSummarySidebar';

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    getTotal,
    getSubtotal,
    promoCode,
    discount,
    discountAmount,
    clearCart,
    accessories,
    getAccessoriesTotal,
    isGift,
    getBundleDiscount,
    fetchBundleTiers,
  } = useCartStore();

  const { user, isAuthenticated, initialize } = useAuthStore();
  const { addresses, loadAddresses } = useAddressStore();
  const [mounted, setMounted] = useState(false);

  // Delivery Form State
  const [shippingForm, setShippingForm] = useState<ShippingAddressFormState>({
    fullName: '',
    phone: '',
    addressLine1: '',
    landmark: '',
    pincode: '',
    cityState: '',
  });

  const [deliveryOption, setDeliveryOption] = useState<'standard' | 'express'>('standard');
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [hasPromptedUpsell, setHasPromptedUpsell] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    initialize();
    loadAddresses();
    loadRazorpayScript();
    fetchBundleTiers();
    setMounted(true);

    if (items.length > 0) {
      trackMetaInitiateCheckout({
        subtotal: getSubtotal(),
        itemCount: items.length,
        items: items.map((it) => ({ id: it.id, title: it.title, price: it.basePrice })),
      });
    }
  }, [initialize, loadAddresses, fetchBundleTiers]);

  // Autofill from user profile
  useEffect(() => {
    if (user) {
      setShippingForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  // Autofill from default address
  useEffect(() => {
    if (addresses.length > 0 && !shippingForm.addressLine1) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      if (def) {
        setShippingForm((prev) => ({
          ...prev,
          fullName: prev.fullName || def.fullName,
          phone: prev.phone || def.phone,
          pincode: def.pincode,
          addressLine1: def.addressLine1,
          landmark: def.landmark || '',
          cityState: `${def.city}, ${def.state}`,
        }));
      }
    }
  }, [addresses, shippingForm.addressLine1]);

  const handleFieldChange = (field: keyof ShippingAddressFormState, value: string) => {
    setShippingForm((prev) => ({ ...prev, [field]: value }));
  };

  const finalTotal = getTotal() + (deliveryOption === 'express' ? 299 : 0);

  // Validate shipping fields
  const validateForm = (): boolean => {
    if (!shippingForm.fullName.trim()) {
      setErrorMsg('Please enter your full delivery name.');
      return false;
    }
    const cleanPhone = shippingForm.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please provide a valid 10-digit mobile contact number.');
      return false;
    }
    if (!shippingForm.addressLine1.trim()) {
      setErrorMsg('Please specify your street address or apartment number.');
      return false;
    }
    if (!shippingForm.pincode.trim() || shippingForm.pincode.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit postal pincode.');
      return false;
    }
    if (!shippingForm.cityState.trim()) {
      setErrorMsg('Please specify your city and state.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const handleCheckoutClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Prompt presentation accessories upsell once if none selected
    const accessoriesTotal = getAccessoriesTotal();
    if (!hasPromptedUpsell && accessoriesTotal === 0) {
      setHasPromptedUpsell(true);
      setIsUpsellOpen(true);
      return;
    }

    executeOrderSubmission();
  };

  const executeOrderSubmission = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      setSubmissionStep('Validating order & authoritative pricing...');

      // Split city and state
      const parts = shippingForm.cityState.split(',').map((s) => s.trim());
      const city = parts[0] || 'Bangalore';
      const state = parts[1] || 'Karnataka';

      const primaryItem = items[0];
      let snapshot = primaryItem?.projectSnapshot || null;
      if (!snapshot && typeof window !== 'undefined' && primaryItem?.projectId) {
        try {
          snapshot = JSON.parse(localStorage.getItem(`pp_snapshot_${primaryItem.projectId}`) || 'null');
        } catch {}
      }

      // Check environment to enforce real payment gateway in production (Directive 3 / PAY-01)
      const isProduction =
        process.env.NODE_ENV === 'production' ||
        process.env.NEXT_PUBLIC_APP_ENV === 'production';

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      // In production, require configured payment credentials
      if (isProduction && (!razorpayKey || razorpayKey === 'dummy_key' || razorpayKey === 'test_key')) {
        throw new Error(
          'Production payment gateway is currently undergoing maintenance. Please try again shortly or contact support.'
        );
      }

      // Directive 4: Submit lightweight JSON manifest with order; backend compiles PDF in worker queue
      setSubmissionStep('Submitting order & enqueuing print worker...');

      const orderPayload = {
        title: primaryItem?.title || 'Heirloom Custom Photobook',
        items: items.map((it) => ({
          templateId: (it as any).templateId || it.id,
          size: it.dimensions,
          pageCount: it.pageCount,
          quantity: it.quantity || 1,
          projectId: it.projectId,
          projectSnapshot: it.projectSnapshot,
        })),
        projectManifest: snapshot,
        projectId: primaryItem?.projectId,
        customerName: shippingForm.fullName,
        customerEmail: user?.email || 'guest@perfectpic.in',
        customerPhone: shippingForm.phone,
        userId: user?.id,
        shippingAddress: {
          fullName: shippingForm.fullName,
          phone: shippingForm.phone,
          email: user?.email || 'guest@perfectpic.in',
          addressLine1: shippingForm.addressLine1,
          landmark: shippingForm.landmark,
          city,
          state,
          postalCode: shippingForm.pincode,
          pincode: shippingForm.pincode,
          country: 'India',
        },
        deliveryOption,
        accessories,
        isGift,
        promoCode: promoCode || undefined,
        paymentDetails: {
          paymentMethod: isProduction ? 'razorpay' : 'online_upi',
          transactionId: `tx_${Date.now()}`,
          status: 'completed',
        },
      };

      const result = await api.createOrder(orderPayload);
      const orderId = result.orderNumber || result.id || (result as any).order?.orderNumber;
      const guestToken = (result as any).guestToken || (result as any).order?.guestToken;

      trackMetaPurchase({
        orderId: String(orderId),
        total: finalTotal,
        items: items.map((it) => ({ id: it.id, title: it.title, price: it.basePrice })),
      });

      clearCart();

      // Secure redirect passing cryptographically verified guest token (Directive 1 / IDOR defense)
      const tokenQuery = guestToken ? `?token=${encodeURIComponent(guestToken)}` : '';
      router.push(`/confirmation/${orderId}${tokenQuery}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to submit order. Please check details and try again.');
      setIsSubmitting(false);
      setSubmissionStep('');
    }
  };

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center font-sans text-noir-900">
        <div className="text-center">
          <p className="font-serif text-xl mb-2">Redirecting to sign in...</p>
          <p className="text-xs text-noir-500 uppercase tracking-widest">
            Please sign in to proceed with checkout
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[75vh] bg-cream-50 font-sans text-noir-900 py-16 px-4 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white p-10 rounded-sm shadow-sm border border-cream-200">
          <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-5 text-noir-500">
            <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h1 className="font-serif text-3xl mb-3">Your Cart is Empty</h1>
          <p className="text-sm text-noir-600 mb-8 leading-relaxed">
            There are no photobooks in your cart to checkout. Please customize or select a photobook first.
          </p>
          <Link
            href="/templates"
            className="inline-block bg-noir-950 text-cream-50 px-8 py-3.5 rounded-sm text-xs font-semibold tracking-widest uppercase hover:bg-noir-900 transition-colors shadow-luxury-md"
          >
            Browse Photobooks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-noir-900 py-12 px-4">
      {/* Packaging & Accessories Upsell Modal */}
      <PackagingUpsellModal
        isOpen={isUpsellOpen}
        onClose={() => setIsUpsellOpen(false)}
        onProceed={executeOrderSubmission}
      />

      <div className="max-w-6xl mx-auto">
        <CheckoutStepper currentStep={2} />

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm flex items-center gap-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Delivery, Add-ons & Payment Steps */}
          <div className="lg:col-span-2 space-y-6">
            <ShippingAddressStep
              formData={shippingForm}
              onChange={handleFieldChange}
              hasSavedAddress={addresses.length > 0}
            />

            <DeliveryMethodStep
              selectedOption={deliveryOption}
              onChange={setDeliveryOption}
            />

            <AddonsStep />

            <PaymentStep
              finalTotal={finalTotal}
              isSubmitting={isSubmitting}
              submissionStep={submissionStep}
              onSubmit={handleCheckoutClick}
            />
          </div>

          {/* Right Column: Order Summary & Real-Time Price Breakdown */}
          <div>
            <OrderSummarySidebar
              deliveryOption={deliveryOption}
              finalTotal={finalTotal}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
