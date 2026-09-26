export default function FAQPage() {
  const faqs = [
    {
      category: "Getting Started",
      questions: [
        { q: "How long does it take to create a book?", a: "With our AI auto-layout, you can create a book in under 60 seconds. Simply select your photos, choose a theme, and we'll handle the rest. You can then review and make manual adjustments if you wish." },
        { q: "Do I need an app to create a book?", a: "No! PerfectPic works entirely in your web browser at perfectpic.in. You can create, edit, and order directly from your smartphone, tablet, or desktop." }
      ]
    },
    {
      category: "Printing & Quality",
      questions: [
        { q: "What does 'non-tearable' mean?", a: "We use a premium synthetic paper that is virtually impossible to tear by hand. It's also water-resistant, making it perfect for families with young children." },
        { q: "What is Lay-flat binding?", a: "Lay-flat binding allows your photo book to open completely flat, with no gutter in the middle. This means a single photo can stretch seamlessly across two pages without losing any detail in the crease." }
      ]
    },
    {
      category: "Shipping & Delivery",
      questions: [
        { q: "How long does shipping take?", a: "Orders are printed and shipped within 3-5 business days. Delivery typically takes an additional 2-4 days depending on your location in India." },
        { q: "Do you charge for shipping?", a: "No, we offer free standard shipping across India on all our photo books." }
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-20 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-5xl text-noir-900 mb-6 text-center">Frequently Asked Questions</h1>
        <p className="text-center text-noir-700 mb-16">Everything you need to know about our products and services.</p>

        <div className="space-y-12">
          {faqs.map((cat, i) => (
            <div key={i}>
              <h2 className="font-serif text-2xl font-semibold mb-6 border-b border-cream-300 pb-2">{cat.category}</h2>
              <div className="space-y-6">
                {cat.questions.map((faq, j) => (
                  <div key={j} className="bg-white p-6 rounded-sm shadow-luxury-sm border border-cream-300">
                    <h3 className="font-sans font-semibold text-lg text-noir-900 mb-2">{faq.q}</h3>
                    <p className="text-noir-700 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
