export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-20 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-serif text-5xl text-noir-900 mb-6 text-center">Pricing & Specifications</h1>
        <p className="text-center text-noir-700 mb-16 max-w-2xl mx-auto">
          We believe in transparent pricing. No hidden fees, no shipping charges across India. Just premium quality photo books at fair prices.
        </p>

        <div className="bg-white border border-cream-300 shadow-luxury-md rounded-sm overflow-hidden mb-20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream-100 border-b border-cream-300">
                <th className="p-6 font-sans font-semibold text-noir-900">Features</th>
                <th className="p-6 font-sans font-semibold text-noir-900 border-l border-cream-300">Standard (8.25" × 8.25")</th>
                <th className="p-6 font-sans font-semibold text-noir-900 border-l border-cream-300">Large (10" × 10")</th>
              </tr>
            </thead>
            <tbody className="text-noir-700">
              <tr className="border-b border-cream-300">
                <td className="p-6 font-medium text-noir-900">Base Price (includes 40 pages)</td>
                <td className="p-6 border-l border-cream-300 font-medium">₹1,999</td>
                <td className="p-6 border-l border-cream-300 font-medium">₹2,499</td>
              </tr>
              <tr className="border-b border-cream-300 bg-cream-50/50">
                <td className="p-6">Extra Pages (per 2 pages)</td>
                <td className="p-6 border-l border-cream-300">₹50</td>
                <td className="p-6 border-l border-cream-300">₹75</td>
              </tr>
              <tr className="border-b border-cream-300">
                <td className="p-6">Max Pages</td>
                <td className="p-6 border-l border-cream-300">76 pages</td>
                <td className="p-6 border-l border-cream-300">76 pages</td>
              </tr>
              <tr className="border-b border-cream-300 bg-cream-50/50">
                <td className="p-6">Paper Quality</td>
                <td className="p-6 border-l border-cream-300" colSpan={2}>Premium Synthetic Non-Tearable (Spill-safe)</td>
              </tr>
              <tr className="border-b border-cream-300">
                <td className="p-6">Print Technology</td>
                <td className="p-6 border-l border-cream-300" colSpan={2}>HP Indigo 12K Ultra-HD</td>
              </tr>
              <tr className="border-b border-cream-300 bg-cream-50/50">
                <td className="p-6">Binding</td>
                <td className="p-6 border-l border-cream-300" colSpan={2}>Lay-flat Seamless Binding</td>
              </tr>
              <tr>
                <td className="p-6">Shipping</td>
                <td className="p-6 border-l border-cream-300 font-medium text-green-600" colSpan={2}>Free PAN-India</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
