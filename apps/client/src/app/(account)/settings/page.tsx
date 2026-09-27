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
              defaultValue={user?.name || "Customer"} 
              className="w-full border border-cream-300 rounded-sm p-3 bg-cream-50 focus:border-foil-gold focus:outline-none text-sm text-noir-900" 
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs uppercase tracking-wider mb-2 text-noir-600 font-medium">Phone</label>
            <input 
              type="tel" 
              defaultValue={user?.phone || "+91 98765 43210"} 
              className="w-full border border-cream-300 rounded-sm p-3 bg-cream-50 focus:border-foil-gold focus:outline-none text-sm text-noir-900" 
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs uppercase tracking-wider mb-2 text-noir-600 font-medium">Email Address</label>
            <input 
              type="email" 
              defaultValue={user?.email || "user@perfectpic.in"} 
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
          <button className="text-xs uppercase tracking-wider text-foil-gold hover:underline font-semibold">+ Add New</button>
        </div>
        
        <div className="border border-cream-300 rounded-sm p-4 relative group bg-cream-50/50">
          <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="text-xs text-noir-500 hover:text-noir-900">Edit</button>
            <button className="text-xs text-red-500 hover:text-red-700">Delete</button>
          </div>
          <span className="text-[10px] uppercase tracking-widest bg-cream-200 text-noir-700 px-2 py-0.5 rounded font-semibold mb-2 inline-block">Default Address</span>
          <p className="font-medium text-sm text-noir-900">{user?.name || "Customer"}</p>
          <p className="text-xs text-noir-600 mt-1 leading-relaxed">
            123 Luxury Lane, Block A<br/>
            Bandra West, Mumbai 400050<br/>
            Maharashtra, India
          </p>
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
