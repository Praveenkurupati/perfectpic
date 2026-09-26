import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-noir-950 flex flex-col items-center justify-center p-4 text-cream-50">
      <div className="w-full max-w-md bg-cream-50 rounded-md shadow-luxury-xl p-8 text-noir-900 border border-cream-300">
        <div className="text-center mb-8">
          <h1 className="text-2xl tracking-[0.2em] uppercase font-bold text-noir-950">Whitebook</h1>
          <p className="text-sm text-noir-600 tracking-widest mt-2 uppercase">Admin Portal</p>
        </div>
        
        <form className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium tracking-wide">Email</label>
            <input 
              type="email" 
              className="w-full px-3 py-2 border border-cream-300 rounded-sm bg-cream-50 focus:outline-none focus:ring-1 focus:ring-noir-950 transition-colors"
              placeholder="admin@whitebook.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium tracking-wide">Password</label>
            <input 
              type="password" 
              className="w-full px-3 py-2 border border-cream-300 rounded-sm bg-cream-50 focus:outline-none focus:ring-1 focus:ring-noir-950 transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="w-full bg-noir-950 text-cream-50 py-3 rounded-sm hover:bg-noir-900 transition-colors tracking-wide">
            Sign In
          </button>
        </form>
      </div>
      <div className="mt-8 text-sm text-noir-400 tracking-widest uppercase">
        © {new Date().getFullYear()} Whitebook
      </div>
    </div>
  );
}
