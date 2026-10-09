import Link from "next/link";
import { Instagram, Facebook, Twitter, MessageCircle } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function Footer() {
  return (
    <footer className="bg-[#F4F2ED] text-[#0A0A0A] border-t border-[#D9D6CF] pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          <div className="lg:col-span-2">
            <Link href="/" aria-label="perfectpic homepage" className="inline-block mb-4">
              <BrandLogo variant="light" height={36} className="h-8 md:h-9 w-auto" />
            </Link>
            <p className="text-[#5C5A55] font-sans text-sm max-w-sm leading-relaxed mb-8 lowercase">
              premium photobooks that last generations. printed on archival paper, delivered across india.
            </p>
            <a 
              href="https://wa.me/919999999999?text=Hi%20PerfectPic%20Team%2C%20I%20need%20help%20with%20my%20photobook" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-[#0A0A0A] hover:bg-[#2A2926] text-white px-4 py-2 rounded-full text-xs font-medium transition-colors"
            >
              <MessageCircle size={16} />
              <span className="lowercase">whatsapp support</span>
            </a>
          </div>

          <div>
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-6">products</h4>
            <ul className="space-y-3">
              <li><Link href="/templates" className="text-[#5C5A55] hover:text-[#0A0A0A] transition-colors text-sm lowercase">hardcover photobooks</Link></li>
              <li><Link href="/templates" className="text-[#5C5A55] hover:text-[#0A0A0A] transition-colors text-sm lowercase">lay-flat albums</Link></li>
              <li><Link href="/pricing" className="text-[#5C5A55] hover:text-[#0A0A0A] transition-colors text-sm lowercase">pricing &amp; specs</Link></li>
              <li><Link href="/configure?bundle=true" className="text-[#5C5A55] hover:text-[#0A0A0A] transition-colors text-sm lowercase">bulk bundles</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-6">company</h4>
            <ul className="space-y-3">
              <li><Link href="/pricing" className="text-[#5C5A55] hover:text-[#0A0A0A] transition-colors text-sm lowercase">our quality</Link></li>
              <li><Link href="/faq" className="text-[#5C5A55] hover:text-[#0A0A0A] transition-colors text-sm lowercase">how it works</Link></li>
              <li><Link href="/faq" className="text-[#5C5A55] hover:text-[#0A0A0A] transition-colors text-sm lowercase">privacy &amp; photos</Link></li>
              <li><Link href="/faq" className="text-[#5C5A55] hover:text-[#0A0A0A] transition-colors text-sm lowercase">contact support</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-6">support</h4>
            <ul className="space-y-3">
              <li><Link href="/faq" className="text-[#5C5A55] hover:text-[#0A0A0A] transition-colors text-sm lowercase">faqs</Link></li>
              <li><Link href="/orders" className="text-[#5C5A55] hover:text-[#0A0A0A] transition-colors text-sm lowercase">track order</Link></li>
              <li><Link href="/projects" className="text-[#5C5A55] hover:text-[#0A0A0A] transition-colors text-sm lowercase">my projects</Link></li>
              <li><Link href="/faq" className="text-[#5C5A55] hover:text-[#0A0A0A] transition-colors text-sm lowercase">100% reprint policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#D9D6CF] flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-[#5C5A55] text-xs lowercase">
            © 2026 perfectpic · made with love in india
          </p>
          <div className="flex space-x-6 text-[#5C5A55]">
            <a href="#" className="hover:text-[#0A0A0A] transition-colors" aria-label="Instagram"><Instagram size={18} /></a>
            <a href="#" className="hover:text-[#0A0A0A] transition-colors" aria-label="Facebook"><Facebook size={18} /></a>
            <a href="#" className="hover:text-[#0A0A0A] transition-colors" aria-label="Twitter"><Twitter size={18} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
