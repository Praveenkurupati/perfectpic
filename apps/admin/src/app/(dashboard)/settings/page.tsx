export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-noir-950">Site Configuration</h1>
        <p className="text-sm text-noir-500 mt-1">Manage global settings, pricing, and rules.</p>
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
