export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-noir-950">Site Configuration</h1>
        <p className="text-sm text-noir-500 mt-1">Manage global settings, pricing, and rules.</p>
      </div>

      {/* Book Page Capacity & 1 Photo Per Page Rules */}
      <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200 overflow-hidden">
        <div className="p-6 border-b border-cream-200 bg-cream-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-noir-950">Book Page Tiers & 1 Photo/Page Rules</h2>
            <p className="text-sm text-noir-500 mt-1">
              Configure page counts (32, 50, 60, 72, 12, 24, 120), badges (Popular, Extended, Collector&apos;s), and pricing adjustments.
            </p>
          </div>
          <a
            href="/pages"
            className="px-4 py-2 bg-noir-950 hover:bg-noir-900 text-cream-50 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
          >
            Manage Page Tiers &rarr;
          </a>
        </div>
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-cream-50 border border-cream-200 rounded-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded font-mono">Popular</span>
            <p className="font-serif text-lg font-bold text-noir-950 mt-1.5">32 Pages</p>
            <p className="text-[11px] text-noir-500">32 Photos • Standard</p>
          </div>
          <div className="p-3 bg-cream-50 border border-cream-200 rounded-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded font-mono">Extended</span>
            <p className="font-serif text-lg font-bold text-noir-950 mt-1.5">50 Pages</p>
            <p className="text-[11px] text-noir-500">50 Photos • +₹600</p>
          </div>
          <div className="p-3 bg-cream-50 border border-cream-200 rounded-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 bg-purple-100 px-1.5 py-0.5 rounded font-mono">Collector&apos;s</span>
            <p className="font-serif text-lg font-bold text-noir-950 mt-1.5">60 Pages</p>
            <p className="text-[11px] text-noir-500">60 Photos • +₹1,000</p>
          </div>
          <div className="p-3 bg-cream-50 border border-cream-200 rounded-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 bg-purple-100 px-1.5 py-0.5 rounded font-mono">Collector&apos;s</span>
            <p className="font-serif text-lg font-bold text-noir-950 mt-1.5">72 Pages</p>
            <p className="text-[11px] text-noir-500">72 Photos • +₹1,400</p>
          </div>
        </div>
      </div>

      {/* Multi-Book Bundles & Volume Discounts */}
      <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200 overflow-hidden">
        <div className="p-6 border-b border-cream-200 bg-cream-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-noir-950">Multi-Book Bundles & Volume Discounts</h2>
            <p className="text-sm text-noir-500 mt-1">
              Configure automated tier discounts for multi-copy orders: 3 Books (Save ₹300), 6 Books (Save ₹1,800), 12 Books (Save ₹4,500) + Free Shipping.
            </p>
          </div>
          <a
            href="/bundles"
            className="px-4 py-2 bg-noir-950 hover:bg-noir-900 text-cream-50 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 shrink-0"
          >
            Manage Bundles &rarr;
          </a>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-cream-50 border border-cream-200 rounded-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded font-mono">Popular</span>
              <span className="text-[10px] text-emerald-700 font-bold uppercase font-mono">Free Ship</span>
            </div>
            <p className="font-serif text-xl font-bold text-noir-950 mt-1.5">3 Books</p>
            <p className="text-xs font-mono font-bold text-emerald-700">Save ₹300 off</p>
            <p className="text-[11px] text-noir-500 mt-0.5">Parent & family gift pack</p>
          </div>
          <div className="p-3.5 bg-cream-50 border border-cream-200 rounded-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded font-mono">Extended</span>
              <span className="text-[10px] text-emerald-700 font-bold uppercase font-mono">Free Ship</span>
            </div>
            <p className="font-serif text-xl font-bold text-noir-950 mt-1.5">6 Books</p>
            <p className="text-xs font-mono font-bold text-emerald-700">Save ₹1,800 off</p>
            <p className="text-[11px] text-noir-500 mt-0.5">Family trips & reunions</p>
          </div>
          <div className="p-3.5 bg-cream-50 border border-cream-200 rounded-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 bg-purple-100 px-1.5 py-0.5 rounded font-mono">Collector&apos;s Master</span>
              <span className="text-[10px] text-emerald-700 font-bold uppercase font-mono">Free Ship</span>
            </div>
            <p className="font-serif text-xl font-bold text-noir-950 mt-1.5">12 Books</p>
            <p className="text-xs font-mono font-bold text-emerald-700">Save ₹4,500 off</p>
            <p className="text-[11px] text-noir-500 mt-0.5">Weddings & annual archives</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200 overflow-hidden">
        <div className="p-6 border-b border-cream-200 bg-cream-50/50">
          <h2 className="text-lg font-semibold text-noir-950">Promo Codes</h2>
          <p className="text-sm text-noir-500 mt-1">Create and manage discount codes.</p>
        </div>
        <div className="p-6">
          <div className="flex justify-end mb-4">
            <button className="px-4 py-2 bg-noir-950 text-cream-50 rounded-sm text-sm font-medium">Add Promo Code</button>
          </div>
          <table className="w-full text-left border-collapse border border-cream-200">
            <thead>
              <tr className="bg-cream-50 border-b border-cream-200">
                <th className="p-3 text-xs font-semibold text-noir-600">CODE</th>
                <th className="p-3 text-xs font-semibold text-noir-600">DISCOUNT</th>
                <th className="p-3 text-xs font-semibold text-noir-600">USAGE</th>
                <th className="p-3 text-xs font-semibold text-noir-600">STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-cream-100">
                <td className="p-3 text-sm font-medium">LAUNCH20</td>
                <td className="p-3 text-sm">20% OFF</td>
                <td className="p-3 text-sm text-noir-600">145 / 500</td>
                <td className="p-3 text-sm"><span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-sm text-xs">Active</span></td>
              </tr>
              <tr>
                <td className="p-3 text-sm font-medium">FESTIVAL500</td>
                <td className="p-3 text-sm">₹500 OFF (Min ₹3000)</td>
                <td className="p-3 text-sm text-noir-600">0 / Unlimited</td>
                <td className="p-3 text-sm"><span className="text-noir-400 bg-cream-100 px-2 py-0.5 rounded-sm text-xs">Inactive</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200 overflow-hidden">
        <div className="p-6 border-b border-cream-200 bg-cream-50/50">
          <h2 className="text-lg font-semibold text-noir-950">Shipping Rates</h2>
          <p className="text-sm text-noir-500 mt-1">Configure base shipping and thresholds.</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-cream-100">
            <div>
              <p className="font-medium text-sm text-noir-900">Standard Shipping (Base)</p>
              <p className="text-xs text-noir-500">Applied to all orders under threshold</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-noir-400">₹</span>
              <input type="number" defaultValue={150} className="w-20 px-2 py-1 border border-cream-300 rounded-sm text-sm" />
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-cream-100">
            <div>
              <p className="font-medium text-sm text-noir-900">Free Shipping Threshold</p>
              <p className="text-xs text-noir-500">Orders above this amount ship free</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-noir-400">₹</span>
              <input type="number" defaultValue={3000} className="w-24 px-2 py-1 border border-cream-300 rounded-sm text-sm" />
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button className="px-4 py-2 bg-noir-950 text-cream-50 rounded-sm text-sm font-medium">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}
