'use client';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-cream-50 font-sans text-noir-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-4xl mb-8">Account Settings</h1>

        <div className="space-y-8">
          {/* Profile */}
          <section className="bg-white p-8 rounded-sm shadow-sm border border-cream-200">
            <h2 className="font-serif text-2xl mb-6">Profile Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs uppercase tracking-wider mb-2 text-noir-600">Name</label>
                <input type="text" defaultValue="Jane Doe" className="w-full border border-cream-300 rounded-sm p-3 bg-cream-50 focus:border-foil-gold focus:outline-none" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs uppercase tracking-wider mb-2 text-noir-600">Phone</label>
                <input type="tel" defaultValue="+91 98765 43210" className="w-full border border-cream-300 rounded-sm p-3 bg-cream-50 focus:border-foil-gold focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs uppercase tracking-wider mb-2 text-noir-600">Email Address</label>
                <input type="email" defaultValue="jane.doe@example.com" className="w-full border border-cream-300 rounded-sm p-3 bg-cream-50 focus:border-foil-gold focus:outline-none" />
              </div>
            </div>
            <button className="mt-6 bg-noir-900 text-cream-50 px-6 py-2 rounded-sm text-sm font-medium hover:bg-noir-950">Save Changes</button>
          </section>

          {/* Addresses */}
          <section className="bg-white p-8 rounded-sm shadow-sm border border-cream-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl">Saved Addresses</h2>
              <button className="text-sm text-foil-gold hover:underline font-medium">+ Add New</button>
            </div>
            
            <div className="border border-cream-300 rounded-sm p-4 relative group">
              <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-xs text-noir-500 hover:text-noir-900">Edit</button>
                <button className="text-xs text-red-500 hover:text-red-700">Delete</button>
              </div>
              <span className="text-xs uppercase tracking-widest bg-cream-100 text-noir-600 px-2 py-1 rounded-sm mb-3 inline-block">Home</span>
              <p className="font-medium text-sm">Jane Doe</p>
              <p className="text-sm text-noir-600 mt-1">123 Luxury Lane, Block A<br/>Bandra West, Mumbai 400050<br/>Maharashtra, India</p>
            </div>
          </section>

          {/* Support */}
          <section className="bg-white p-8 rounded-sm shadow-sm border border-cream-200">
            <h2 className="font-serif text-2xl mb-6">Need Help?</h2>
            <p className="text-sm text-noir-600 mb-6">Having issues with your order or the editor? Drop us a message.</p>
            
            <form className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider mb-2 text-noir-600">Topic</label>
                <select className="w-full border border-cream-300 rounded-sm p-3 bg-white focus:border-foil-gold focus:outline-none text-sm">
                  <option>Order Status</option>
                  <option>Editor Help</option>
                  <option>Quality Issue</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider mb-2 text-noir-600">Message</label>
                <textarea rows={4} className="w-full border border-cream-300 rounded-sm p-3 bg-white focus:border-foil-gold focus:outline-none text-sm" placeholder="How can we help you?"></textarea>
              </div>
              <button type="submit" className="border border-noir-900 text-noir-900 px-6 py-2 rounded-sm text-sm font-medium hover:bg-cream-50">Submit Ticket</button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
