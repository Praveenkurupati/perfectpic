'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAddressStore } from '@/stores/useAddressStore';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { addresses } = useAddressStore();

  return (
    <div className="space-y-8">
      {/* Profile */}
      <section className="bg-white p-6 md:p-8 rounded-sm shadow-luxury-xs border border-cream-200">
        <h2 className="font-serif text-2xl font-semibold mb-6 text-noir-900">Profile Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs uppercase tracking-wider mb-2 text-noir-600 font-medium">Name</label>
            <input 
              type="text" 
              defaultValue={user?.name || ""} 
              placeholder="Your Name"
              className="w-full border border-cream-300 rounded-sm p-3 bg-cream-50 focus:border-foil-gold focus:outline-none text-sm text-noir-900" 
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs uppercase tracking-wider mb-2 text-noir-600 font-medium">Phone</label>
            <input 
              type="tel" 
              defaultValue={user?.phone || ""} 
              placeholder="Your Phone Number"
              className="w-full border border-cream-300 rounded-sm p-3 bg-cream-50 focus:border-foil-gold focus:outline-none text-sm text-noir-900" 
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs uppercase tracking-wider mb-2 text-noir-600 font-medium">Email Address</label>
            <input 
              type="email" 
              defaultValue={user?.email || ""} 
              placeholder="Your Email Address"
              className="w-full border border-cream-300 rounded-sm p-3 bg-cream-50 focus:border-foil-gold focus:outline-none text-sm text-noir-900" 
            />
          </div>
        </div>
        <button className="mt-6 bg-noir-900 text-cream-50 px-6 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-noir-950 transition-colors">
          Save Changes
        </button>
      </section>

      {/* Addresses */}
      <section className="bg-white p-6 md:p-8 rounded-sm shadow-luxury-xs border border-cream-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-noir-900">Saved Addresses</h2>
            <p className="text-xs text-noir-500 uppercase tracking-wider mt-0.5">
              Default shipping locations for your archival prints
            </p>
          </div>
          <Link
            href="/addresses"
            className="text-xs font-semibold uppercase tracking-wider text-noir-900 border border-cream-300 hover:border-noir-900 px-3 py-1.5 rounded-sm hover:bg-cream-100 transition-colors flex items-center gap-1.5"
          >
            <MapPin size={13} />
            <span>Manage All ({addresses.length})</span>
          </Link>
        </div>
        
        {addresses.length === 0 ? (
          <div className="border border-dashed border-cream-300 rounded-sm p-6 text-center bg-cream-50/50">
            <p className="text-sm text-noir-600">No saved addresses yet.</p>
            <Link href="/addresses" className="inline-block mt-2 text-xs font-semibold text-foil-gold hover:underline">
              Add your first shipping address →
            </Link>
          </div>
        ) : (
          <div className="bg-cream-50/60 p-4 border border-cream-200 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-noir-900 uppercase">
                  {addresses.find(a => a.isDefault)?.fullName || addresses[0]?.fullName}
                </span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">
                  Default Address
                </span>
              </div>
              <p className="text-xs text-noir-600">
                {addresses.find(a => a.isDefault)?.addressLine1 || addresses[0]?.addressLine1},{' '}
                {addresses.find(a => a.isDefault)?.city || addresses[0]?.city},{' '}
                {addresses.find(a => a.isDefault)?.pincode || addresses[0]?.pincode}
              </p>
            </div>
            <Link
              href="/addresses"
              className="text-xs font-semibold text-noir-800 hover:text-noir-950 underline underline-offset-4 shrink-0"
            >
              Change Default →
            </Link>
          </div>
        )}
      </section>

      {/* Support */}
      <section className="bg-white p-6 md:p-8 rounded-sm shadow-luxury-xs border border-cream-200">
        <h2 className="font-serif text-2xl font-semibold mb-2 text-noir-900">Need Help?</h2>
        <p className="text-xs text-noir-600 mb-6">Having issues with your order or the editor? Reach our concierge team.</p>
        
        <form className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider mb-2 text-noir-600 font-medium">Topic</label>
            <select className="w-full border border-cream-300 rounded-sm p-3 bg-white focus:border-foil-gold focus:outline-none text-sm text-noir-900">
              <option>Order Status</option>
              <option>Editor Help</option>
              <option>Quality & Printing</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider mb-2 text-noir-600 font-medium">Message</label>
            <textarea rows={4} className="w-full border border-cream-300 rounded-sm p-3 bg-white focus:border-foil-gold focus:outline-none text-sm text-noir-900" placeholder="How can we assist you today?"></textarea>
          </div>
          <button type="button" className="border border-noir-900 text-noir-900 px-6 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-cream-100 transition-colors">
            Submit Ticket
          </button>
        </form>
      </section>
    </div>
  );
}
