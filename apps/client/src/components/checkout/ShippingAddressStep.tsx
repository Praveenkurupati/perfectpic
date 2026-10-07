// apps/client/src/components/checkout/ShippingAddressStep.tsx
'use client';

import React from 'react';
import { MapPin, CheckCircle2 } from 'lucide-react';

export interface ShippingAddressFormState {
  fullName: string;
  phone: string;
  addressLine1: string;
  landmark: string;
  pincode: string;
  cityState: string;
}

interface ShippingAddressStepProps {
  formData: ShippingAddressFormState;
  onChange: (field: keyof ShippingAddressFormState, value: string) => void;
  hasSavedAddress?: boolean;
}

export const ShippingAddressStep: React.FC<ShippingAddressStepProps> = ({
  formData,
  onChange,
  hasSavedAddress = false,
}) => {
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
          <input
            type="text"
            required
            maxLength={6}
            value={formData.pincode}
            onChange={(e) => onChange('pincode', e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 560001"
            className="w-full border border-cream-300 p-3 rounded-sm bg-white text-noir-900 focus:outline-none focus:border-noir-950 text-sm font-mono tracking-wider"
          />
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
    </section>
  );
};

export default ShippingAddressStep;
