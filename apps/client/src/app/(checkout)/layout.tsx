import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <header className="bg-white border-b border-cream-300 py-6">
        <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
          <Link href="/">
            <span className="font-display font-bold text-2xl tracking-[0.3em] uppercase text-noir-950">
              PerfectPic
            </span>
          </Link>
          <div className="flex items-center text-green-700 text-sm font-medium">
            <ShieldCheck size={18} className="mr-1" />
            Secure Checkout
          </div>
        </div>
      </header>
      <main className="flex-1 py-12">{children}</main>
    </div>
  );
}
