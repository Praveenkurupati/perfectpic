import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <header className="bg-white border-b border-cream-300 py-5">
        <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
          <Link href="/" aria-label="PerfectPic Homepage" className="flex items-center">
            <BrandLogo variant="light" height={34} className="h-8 w-auto" />
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
