'use client';

import { useAuthStore } from '@/stores/useAuthStore';

export default function SettingsPage() {
  const { user } = useAuthStore();

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
          <h2 className="font-serif text-2xl font-semibold text-noir-900">Saved Addresses</h2>
        </div>
        
        <div className="border border-dashed border-cream-300 rounded-sm p-6 text-center bg-cream-50/50">
          <p className="text-sm text-noir-600">No saved addresses yet.</p>
          <p className="text-xs text-noir-500 mt-1">Delivery addresses you enter during checkout will be saved here automatically.</p>
        </div>
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
