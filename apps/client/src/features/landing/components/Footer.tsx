import Link from "next/link";
import { Instagram, Facebook, Twitter, MessageCircle } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function Footer() {
  return (
    <footer className="bg-noir-950 text-cream-50 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          <div className="lg:col-span-2">
            <Link href="/" aria-label="PerfectPic Homepage" className="inline-block mb-4">
              <BrandLogo variant="dark" height={36} className="h-8 md:h-9 w-auto" />
            </Link>
            <p className="text-cream-50/70 font-sans text-sm max-w-sm leading-relaxed mb-8">
              Premium Custom Photo Books That Last Generations. Printed on archival non-tearable paper with lay-flat binding for memories that deserve more than a phone gallery. Built with love on perfectpic.in.
            </p>
            <a 
              href="https://wa.me/919999999999?text=Hi%20PerfectPic%20Team%2C%20I%20need%20help%20with%20my%20photobook" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              <MessageCircle size={18} />
              <span className="text-sm font-medium">WhatsApp Desk</span>
            </a>
          </div>

          <div>
            <h4 className="font-serif text-lg font-semibold mb-6">Products</h4>
            <ul className="space-y-4">
              <li><Link href="/configure" className="text-cream-50/70 hover:text-foil-gold transition-colors text-sm">Hardcover Photobooks</Link></li>
              <li><Link href="/configure" className="text-cream-50/70 hover:text-foil-gold transition-colors text-sm">Lay-flat Albums</Link></li>
              <li><Link href="/pricing" className="text-cream-50/70 hover:text-foil-gold transition-colors text-sm">Pricing & Specs</Link></li>
              <li><Link href="/configure" className="text-cream-50/70 hover:text-foil-gold transition-colors text-sm">Bulk Bundles</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg font-semibold mb-6">Company</h4>
            <ul className="space-y-4">
              <li><Link href="/pricing" className="text-cream-50/70 hover:text-foil-gold transition-colors text-sm">Our Quality & Specs</Link></li>
              <li><Link href="/faq" className="text-cream-50/70 hover:text-foil-gold transition-colors text-sm">How It Works</Link></li>
              <li><Link href="/faq" className="text-cream-50/70 hover:text-foil-gold transition-colors text-sm">Privacy & Photos</Link></li>
              <li><Link href="/faq" className="text-cream-50/70 hover:text-foil-gold transition-colors text-sm">Contact Support</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg font-semibold mb-6">Support & Account</h4>
            <ul className="space-y-4">
              <li><Link href="/faq" className="text-cream-50/70 hover:text-foil-gold transition-colors text-sm">FAQs</Link></li>
              <li><Link href="/orders" className="text-cream-50/70 hover:text-foil-gold transition-colors text-sm">Track Order</Link></li>
              <li><Link href="/projects" className="text-cream-50/70 hover:text-foil-gold transition-colors text-sm">My Saved Projects</Link></li>
              <li><Link href="/settings" className="text-cream-50/70 hover:text-foil-gold transition-colors text-sm">Account Settings</Link></li>
              <li><Link href="/faq" className="text-cream-50/70 hover:text-foil-gold transition-colors text-sm">100% Reprint Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-cream-50/20 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-cream-50/50 text-xs">
            © {new Date().getFullYear()} PerfectPic (perfectpic.in). All rights reserved. | Made with ❤️ in India
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-cream-50/50 hover:text-foil-gold transition-colors"><Instagram size={20} /></a>
            <a href="#" className="text-cream-50/50 hover:text-foil-gold transition-colors"><Facebook size={20} /></a>
            <a href="#" className="text-cream-50/50 hover:text-foil-gold transition-colors"><Twitter size={20} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
