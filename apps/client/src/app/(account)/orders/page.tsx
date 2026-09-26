'use client';

export default function OrdersPage() {
  const orders = [
    { id: '#WB-8491', title: 'Our Wedding', date: '26 Sep 2026', amount: '₹3,099', status: 'Production', statusColor: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: '#WB-7201', title: 'Bali Trip 2025', date: '14 Jan 2026', amount: '₹2,499', status: 'Delivered', statusColor: 'text-green-600 bg-green-50 border-green-200' },
  ];

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-noir-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-serif text-4xl mb-8">My Orders</h1>

        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-sm shadow-sm border border-cream-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-cream-100 rounded-sm overflow-hidden shrink-0">
                  <img src="https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=150&auto=format&fit=crop" alt="Cover" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-serif text-xl mb-1">{order.title}</h3>
                  <p className="text-sm text-noir-500 mb-2">Order {order.id} • {order.date}</p>
                  <span className={`text-xs px-2 py-1 rounded-sm border ${order.statusColor} font-medium tracking-wider uppercase`}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-cream-200">
                <span className="font-serif text-xl">{order.amount}</span>
                <button className="text-sm font-medium border border-noir-900 px-4 py-2 rounded-sm hover:bg-cream-50 transition-colors">
                  {order.status === 'Delivered' ? 'Order Again' : 'Track Order'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
