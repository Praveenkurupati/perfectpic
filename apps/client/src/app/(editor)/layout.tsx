import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-cream-50 overflow-hidden">
      {/* Minimal Top Bar */}
      <header className="h-16 bg-white border-b border-cream-300 flex items-center justify-between px-4 md:px-8 shrink-0">
        <div className="flex items-center">
          <Link href="/configure" className="text-noir-700 hover:text-noir-950 flex items-center text-sm font-medium transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back
          </Link>
        </div>
        
        <div className="font-display font-bold text-xl tracking-[0.2em] uppercase text-noir-950">
          PerfectPic Editor
        </div>
        
        <div>
          <button className="px-4 py-2 bg-noir-950 text-cream-50 text-sm font-medium rounded-sm hover:bg-noir-900 transition-colors">
            Save & Continue
          </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden flex flex-col">{children}</main>
    </div>
  );
}
