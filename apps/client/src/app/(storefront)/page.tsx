import Link from "next/link";
import { Star, ShieldCheck, Droplet, Layout, Check, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-cream-50">
        <div className="container mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl z-10">
            <h1 className="font-serif text-5xl md:text-7xl font-medium leading-tight text-noir-900 mb-6">
              Create Your Photo Book in 60 Seconds
            </h1>
            <p className="font-sans text-lg text-noir-700 mb-10 leading-relaxed max-w-lg">
              Upload from your phone. Our AI crafts the perfect layout. Printed on non-tearable, spill-safe pages that last generations.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
              <Link 
                href="/configure" 
                className="inline-flex justify-center items-center px-8 py-4 bg-noir-950 text-cream-50 font-medium tracking-wide hover:bg-noir-900 transition-all rounded-sm text-center"
              >
                Start Creating
              </Link>
              <Link 
                href="#how-it-works" 
                className="inline-flex justify-center items-center px-8 py-4 bg-cream-100 text-noir-900 border border-cream-300 font-medium tracking-wide hover:bg-cream-50 transition-all rounded-sm text-center"
              >
                See How It Works
              </Link>
            </div>
            
            <div className="mt-12 flex flex-wrap gap-4">
              <span className="inline-flex items-center px-3 py-1 bg-white border border-cream-300 rounded-full text-xs font-medium text-noir-700 shadow-sm">
                <Check size={14} className="mr-1 text-foil-gold" /> 12K Ultra-HD
              </span>
              <span className="inline-flex items-center px-3 py-1 bg-white border border-cream-300 rounded-full text-xs font-medium text-noir-700 shadow-sm">
                <Check size={14} className="mr-1 text-foil-gold" /> 100% Non-Tearable
              </span>
              <span className="inline-flex items-center px-3 py-1 bg-white border border-cream-300 rounded-full text-xs font-medium text-noir-700 shadow-sm">
                <Check size={14} className="mr-1 text-foil-gold" /> Lay-Flat Binding
              </span>
            </div>
          </div>
          
          <div className="relative h-[400px] md:h-[600px] w-full flex justify-center items-center">
            {/* Book Mockup Placeholder */}
            <div className="relative w-[300px] h-[400px] md:w-[450px] md:h-[600px] bg-cream-100 shadow-book-spread rounded-sm border border-cream-300 flex items-center justify-center transform rotate-[-5deg] hover:rotate-0 transition-transform duration-700">
              <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/20 to-transparent"></div>
              <p className="font-display tracking-[0.2em] text-noir-900/30 uppercase">Premium Photobook</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-noir-900 mb-4">Create For Every Milestone</h2>
            <p className="text-noir-700 max-w-2xl mx-auto">Select a theme to auto-fill your book with gorgeous, occasion-specific layouts.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {[
              { name: "Travel Diaries", emoji: "✈️", desc: "For your wanderlust" },
              { name: "Baby's First Year", emoji: "👶", desc: "Milestones preserved" },
              { name: "Wedding", emoji: "💍", desc: "The big day" },
              { name: "Birthday", emoji: "🎂", desc: "Annual celebrations" },
              { name: "Anniversary", emoji: "🥂", desc: "Years of love" },
              { name: "Festivals", emoji: "🪔", desc: "Joyous occasions" },
              { name: "Pet & Paws", emoji: "🐾", desc: "Furry friends" },
              { name: "Special Moments", emoji: "✨", desc: "Everyday magic" }
            ].map((cat, i) => (
              <Link 
                key={i} 
                href={`/configure?category=${encodeURIComponent(cat.name)}`}
                className="bg-cream-100 p-6 md:p-8 rounded-sm hover:shadow-luxury-md transition-all cursor-pointer border border-transparent hover:border-cream-300 text-center flex flex-col items-center hover:-translate-y-1 block"
              >
                <span className="text-4xl mb-4">{cat.emoji}</span>
                <h3 className="font-sans font-semibold text-noir-900 mb-2">{cat.name}</h3>
                <p className="text-sm text-noir-700">{cat.desc}</p>
                <span className="mt-4 text-[11px] font-medium uppercase tracking-[0.15em] text-foil-gold">Start Book →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Craftsmanship Section */}
      <section className="py-24 bg-cream-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-noir-900 mb-4">Built to Last. Crafted to Impress.</h2>
            <p className="text-noir-700 max-w-2xl mx-auto">We don't compromise on quality. Every book is printed on industry-leading presses with premium materials.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Ultra-HD 12K Print", desc: "Unmatched clarity and color vibrancy that brings your photos to life.", icon: <Star className="w-8 h-8 text-foil-gold mb-4" /> },
              { title: "HP Indigo Certified", desc: "Printed on world-class presses for gallery-quality reproduction.", icon: <ShieldCheck className="w-8 h-8 text-foil-gold mb-4" /> },
              { title: "Non-Tearable Pages", desc: "Synthetic premium paper that resists tearing, perfect for family viewing.", icon: <Layout className="w-8 h-8 text-foil-gold mb-4" /> },
              { title: "Spill-Safe & Waterproof", desc: "Accidents happen. Our pages wipe clean without smudging.", icon: <Droplet className="w-8 h-8 text-foil-gold mb-4" /> },
              { title: "Lay-Flat Binding", desc: "Seamless panoramic spreads that open perfectly flat on the table.", icon: <Layout className="w-8 h-8 text-foil-gold mb-4" /> },
              { title: "Silky Matte Lamination", desc: "A luxurious finish that feels soft to the touch and reduces glare.", icon: <Star className="w-8 h-8 text-foil-gold mb-4" /> },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 border border-cream-300 rounded-sm shadow-luxury-sm">
                {feature.icon}
                <h3 className="font-serif text-xl font-semibold text-noir-900 mb-3">{feature.title}</h3>
                <p className="text-noir-700 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Pricing Section (Placeholder for Client Component) */}
      <section className="py-24 bg-noir-950 text-cream-50">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="font-serif text-4xl md:text-5xl mb-4 text-cream-50">Transparent Pricing. No Hidden Costs.</h2>
          <p className="text-cream-50/70 mb-12 max-w-2xl mx-auto">Calculate your exact price before you start. Free shipping PAN-India on all orders.</p>
          
          {/* Note: Full interactive pricing calculator would go here as a client component */}
          <div className="max-w-4xl mx-auto bg-noir-900 border border-noir-700 p-8 rounded-sm shadow-luxury-lg">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
              <div className="text-left">
                <h3 className="font-sans text-xl font-medium mb-2">Standard 8.25" × 8.25"</h3>
                <p className="text-cream-50/60">Hardcover • 40 Pages • Up to 120 Photos</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-serif mb-2">₹1,999</div>
                <p className="text-cream-50/60 text-sm mb-4">Includes taxes & shipping</p>
                <Link 
                  href="/configure" 
                  className="inline-flex items-center px-6 py-3 bg-cream-50 text-noir-950 font-medium hover:bg-cream-100 transition-colors rounded-sm"
                >
                  Start Creating <ChevronRight size={16} className="ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bundle Promotion */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="bg-cream-100 border border-foil-gold/30 p-8 md:p-12 rounded-sm text-center shadow-luxury-md">
            <h2 className="font-serif text-3xl md:text-4xl text-noir-900 mb-4">Family & Corporate Bundles</h2>
            <p className="text-noir-700 mb-8 max-w-2xl mx-auto">Perfect for gifting. The more you print, the more you save.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { count: 3, discount: "₹300 off" },
                { count: 6, discount: "₹1,800 off" },
                { count: 12, discount: "₹4,500 off" }
              ].map((bundle, i) => (
                <div key={i} className="bg-white border border-cream-300 p-6 rounded-sm">
                  <div className="font-serif text-2xl font-semibold mb-2">{bundle.count} Books</div>
                  <div className="text-foil-gold font-medium mb-4">Save {bundle.discount}</div>
                  <div className="text-xs text-noir-700 flex items-center justify-center">
                    <Check size={12} className="mr-1 text-green-600" /> Free Shipping
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-cream-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-noir-900 mb-4">Loved by 10,000+ Families</h2>
            <div className="flex items-center justify-center space-x-2 text-noir-900">
              <span className="font-bold text-xl">4.9</span>
              <div className="flex text-foil-gold">
                {[1,2,3,4,5].map(s => <Star key={s} size={20} fill="currentColor" />)}
              </div>
              <span className="text-noir-700">on Google Reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { name: "Priya S.", text: "The print quality blew me away. It literally looks like a luxury coffee table book you'd buy in a high-end store." },
              { name: "Rahul M.", text: "My toddler spilled water on it the first day. I wiped it off and it was completely fine. Worth every rupee." },
              { name: "Neha K.", text: "The AI layout feature saved me hours. It perfectly grouped photos from our Europe trip. Highly recommend!" }
            ].map((review, i) => (
              <div key={i} className="bg-white p-8 border border-cream-300 shadow-luxury-sm rounded-sm">
                <div className="flex text-foil-gold mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="currentColor" />)}
                </div>
                <p className="text-noir-700 italic mb-6">"{review.text}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-cream-300 rounded-full flex items-center justify-center text-noir-900 font-bold font-serif mr-3">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-noir-900 text-sm">{review.name}</div>
                    <div className="text-xs text-green-600 flex items-center">
                      <Check size={10} className="mr-1" /> Verified Buyer
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-noir-950 text-cream-50 text-center relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="font-serif text-5xl md:text-6xl mb-6 max-w-4xl mx-auto">Your Memories Deserve Better Than a Phone Gallery</h2>
          <p className="text-xl text-cream-50/70 mb-10 max-w-2xl mx-auto font-sans">
            Bring them into the real world with a premium handcrafted photobook.
          </p>
          <Link 
            href="/configure" 
            className="inline-flex justify-center items-center px-10 py-5 bg-cream-50 text-noir-950 font-semibold tracking-wide hover:bg-cream-100 transition-all rounded-sm text-lg"
          >
            Start Creating Your Book
          </Link>
        </div>
      </section>
    </div>
  );
}
