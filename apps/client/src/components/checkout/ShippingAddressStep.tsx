// apps/client/src/components/checkout/ShippingAddressStep.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle2, Truck, Loader2, AlertCircle, Gift, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

export interface ShippingAddressFormState {
  fullName: string;
  phone: string;
  addressLine1: string;
  landmark: string;
  pincode: string;
  cityState: string;
}

export interface SplitGiftRecipient {
  recipientName: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  giftMessage?: string;
}

interface ShippingAddressStepProps {
  formData: ShippingAddressFormState;
  onChange: (field: keyof ShippingAddressFormState, value: string) => void;
  hasSavedAddress?: boolean;
  recipients?: SplitGiftRecipient[];
  onRecipientsChange?: (recipients: SplitGiftRecipient[]) => void;
}

export const ShippingAddressStep: React.FC<ShippingAddressStepProps> = ({
  formData,
  onChange,
  hasSavedAddress = false,
  recipients = [],
  onRecipientsChange,
}) => {
  // Pincode Delivery Estimation State (Issue 14)
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [deliveryEstimate, setDeliveryEstimate] = useState<{
    city: string;
    state: string;
    isServiceable: boolean;
    estimatedDays?: string;
    courierPartner?: string;
  } | null>(null);
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  // Multi-recipient split gifting state (PROD-01)
  const [isSplitGifting, setIsSplitGifting] = useState(recipients.length > 0);

  // Lookup delivery estimates when pincode hits 6 digits
  useEffect(() => {
    const cleanPin = formData.pincode.replace(/\D/g, '');
    if (cleanPin.length === 6) {
      let isMounted = true;
      setIsLookingUp(true);
      setPincodeError(null);

      api.pincodeLookup(cleanPin)
        .then((res) => {
          if (!isMounted) return;
          setDeliveryEstimate(res);
          setIsLookingUp(false);
          // Autofill city & state if user has not manually set it
          if (!formData.cityState.trim() && res.city && res.state) {
            onChange('cityState', `${res.city}, ${res.state}`);
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setIsLookingUp(false);
          setDeliveryEstimate({
            city: 'India',
            state: 'General Region',
            isServiceable: true,
            estimatedDays: '4-6 Business Days',
            courierPartner: 'Standard Express Courier',
          });
        });

      return () => {
        isMounted = false;
      };
    } else {
      setDeliveryEstimate(null);
      if (cleanPin.length > 0 && cleanPin.length < 6) {
        setPincodeError(null);
      }
    }
  }, [formData.pincode, formData.cityState, onChange]);

  const handleAddRecipient = () => {
    if (!onRecipientsChange) return;
    const newRecipient: SplitGiftRecipient = {
      recipientName: '',
      phone: '',
      addressLine1: '',
      city: '',
      state: '',
      pincode: '',
      giftMessage: 'With love and cherished memories.',
    };
    onRecipientsChange([...recipients, newRecipient]);
  };

  const handleUpdateRecipient = (index: number, field: keyof SplitGiftRecipient, val: string) => {
    if (!onRecipientsChange) return;
    const updated = [...recipients];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: val };
      onRecipientsChange(updated);
    }
  };

  const handleRemoveRecipient = (index: number) => {
    if (!onRecipientsChange) return;
    onRecipientsChange(recipients.filter((_, i) => i !== index));
  };

  return (
    <section className="bg-white p-8 rounded-sm shadow-sm border border-cream-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl flex items-center gap-2 text-noir-900">
          <MapPin className="w-5 h-5 text-noir-700" />
          <span>Delivery Address</span>
        </h2>
        {hasSavedAddress && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Saved Address Loaded
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-noir-600 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            placeholder="e.g. Priya Sharma"
            className="w-full border border-cream-300 p-3 rounded-sm bg-white text-noir-900 focus:outline-none focus:border-noir-950 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-noir-600 mb-1">
            Mobile Phone *
          </label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="10-digit mobile number"
            className="w-full border border-cream-300 p-3 rounded-sm bg-white text-noir-900 focus:outline-none focus:border-noir-950 text-sm font-mono"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-noir-600 mb-1">
            Street Address / Apartment *
          </label>
          <input
            type="text"
            required
            value={formData.addressLine1}
            onChange={(e) => onChange('addressLine1', e.target.value)}
            placeholder="House / Flat No., Building, Street Name"
            className="w-full border border-cream-300 p-3 rounded-sm bg-white text-noir-900 focus:outline-none focus:border-noir-950 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-noir-600 mb-1">
            Landmark (Optional)
          </label>
          <input
            type="text"
            value={formData.landmark}
            onChange={(e) => onChange('landmark', e.target.value)}
            placeholder="Near Metro Station, Opposite Park, etc."
            className="w-full border border-cream-300 p-3 rounded-sm bg-white text-noir-900 focus:outline-none focus:border-noir-950 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-noir-600 mb-1">
            Pincode (6 digits) *
          </label>
          <div className="relative">
            <input
              type="text"
              required
              maxLength={6}
              value={formData.pincode}
              onChange={(e) => onChange('pincode', e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 560001"
              className="w-full border border-cream-300 p-3 rounded-sm bg-white text-noir-900 focus:outline-none focus:border-noir-950 text-sm font-mono tracking-wider"
            />
            {isLookingUp && (
              <div className="absolute right-3 top-3.5 flex items-center gap-1.5 text-xs text-noir-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-foil-gold" />
                <span className="text-[11px] font-mono">Verifying...</span>
              </div>
            )}
          </div>
          {pincodeError && (
            <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{pincodeError}</span>
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-noir-600 mb-1">
            City & State *
          </label>
          <input
            type="text"
            required
            value={formData.cityState}
            onChange={(e) => onChange('cityState', e.target.value)}
            placeholder="e.g. Bangalore, Karnataka"
            className="w-full border border-cream-300 p-3 rounded-sm bg-white text-noir-900 focus:outline-none focus:border-noir-950 text-sm"
          />
        </div>
      </div>

      {/* Dynamic Postal Code Delivery Estimate Indicator (Issue 14) */}
      {deliveryEstimate && (
        <div className="mt-4 p-3.5 bg-cream-50 border border-cream-200 rounded-sm flex items-start gap-3">
          <Truck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <div className="text-xs">
            <div className="flex items-center gap-2 font-medium text-noir-900">
              <span className="text-emerald-700 font-semibold">Serviceable Destination</span>
              <span>•</span>
              <span className="text-noir-600">{deliveryEstimate.city}, {deliveryEstimate.state}</span>
            </div>
            <p className="text-noir-500 mt-0.5 text-[11.5px]">
              Carrier: <strong>{deliveryEstimate.courierPartner}</strong> — Est. Delivery Arrival: <strong>{deliveryEstimate.estimatedDays}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Split Shipment / Multi-Recipient Gifting Workflow (PROD-01) */}
      <div className="mt-8 pt-6 border-t border-cream-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-foil-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-noir-800">
              Send to Multiple Gift Recipients (Split Delivery)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextState = !isSplitGifting;
              setIsSplitGifting(nextState);
              if (nextState && recipients.length === 0) {
                handleAddRecipient();
              }
            }}
            className="text-xs font-medium text-foil-gold hover:underline"
          >
            {isSplitGifting ? 'Switch to Single Address' : '+ Add Gift Recipients'}
          </button>
        </div>

        {isSplitGifting && (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-noir-500">
              Deliver individual photobook keepsakes to separate family or wedding gift addresses in one order.
            </p>
            {recipients.map((rec, idx) => (
              <div key={idx} className="p-4 bg-cream-50/70 border border-cream-200 rounded-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-noir-700">
                    Recipient #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(idx)}
                    className="text-noir-400 hover:text-red-600 text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Recipient Full Name"
                    value={rec.recipientName}
                    onChange={(e) => handleUpdateRecipient(idx, 'recipientName', e.target.value)}
                    className="border border-cream-300 p-2 text-xs rounded-sm bg-white"
                  />
                  <input
                    type="tel"
                    placeholder="Recipient Mobile Phone"
                    value={rec.phone}
                    onChange={(e) => handleUpdateRecipient(idx, 'phone', e.target.value)}
                    className="border border-cream-300 p-2 text-xs rounded-sm bg-white font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Street Address / Residence"
                    value={rec.addressLine1}
                    onChange={(e) => handleUpdateRecipient(idx, 'addressLine1', e.target.value)}
                    className="border border-cream-300 p-2 text-xs rounded-sm bg-white sm:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="City & State"
                    value={rec.city ? `${rec.city}, ${rec.state}` : ''}
                    onChange={(e) => {
                      const [c = '', s = ''] = e.target.value.split(',');
                      handleUpdateRecipient(idx, 'city', c.trim());
                      handleUpdateRecipient(idx, 'state', s.trim());
                    }}
                    className="border border-cream-300 p-2 text-xs rounded-sm bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Pincode (6 digits)"
                    maxLength={6}
                    value={rec.pincode}
                    onChange={(e) => handleUpdateRecipient(idx, 'pincode', e.target.value.replace(/\D/g, ''))}
                    className="border border-cream-300 p-2 text-xs rounded-sm bg-white font-mono"
                  />
                  <textarea
                    rows={2}
                    placeholder="Personalized Gift Message card text..."
                    value={rec.giftMessage || ''}
                    onChange={(e) => handleUpdateRecipient(idx, 'giftMessage', e.target.value)}
                    className="border border-cream-300 p-2 text-xs rounded-sm bg-white sm:col-span-2"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddRecipient}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-noir-900 border border-cream-300 bg-white px-3 py-1.5 rounded-sm hover:bg-cream-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-foil-gold" />
              <span>Add Another Gift Recipient</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ShippingAddressStep;
