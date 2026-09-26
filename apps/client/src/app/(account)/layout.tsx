import Link from "next/link";
import { Package, FolderOpen, Settings, LogOut } from "lucide-react";
import { Header } from "@/features/landing/components/Header";
import { Footer } from "@/features/landing/components/Footer";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-cream-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-serif text-4xl font-semibold text-noir-900 mb-8">My Account</h1>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 shrink-0">
              <nav className="flex flex-col space-y-1">
                <Link href="/account/orders" className="flex items-center px-4 py-3 bg-white border border-cream-300 rounded-sm text-noir-900 font-medium shadow-luxury-sm">
                  <Package size={18} className="mr-3 text-foil-gold" />
                  My Orders
                </Link>
                <Link href="/account/projects" className="flex items-center px-4 py-3 hover:bg-cream-100 rounded-sm text-noir-700 transition-colors">
                  <FolderOpen size={18} className="mr-3" />
                  Saved Projects
                </Link>
                <Link href="/account/settings" className="flex items-center px-4 py-3 hover:bg-cream-100 rounded-sm text-noir-700 transition-colors">
                  <Settings size={18} className="mr-3" />
                  Account Settings
                </Link>
                <button className="flex items-center px-4 py-3 hover:bg-red-50 hover:text-red-600 rounded-sm text-noir-700 transition-colors text-left w-full mt-4">
                  <LogOut size={18} className="mr-3" />
                  Sign Out
                </button>
              </nav>
            </aside>
            
            {/* Main Content Area */}
            <div className="flex-1 bg-white border border-cream-300 rounded-sm shadow-luxury-sm p-6 md:p-8 min-h-[500px]">
              {children}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
