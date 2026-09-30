"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from "lucide-react";
import { adminApi } from "@/lib/api";
import { getStorefrontUrl } from "@/lib/urls";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await adminApi.login({
        email: email.trim(),
        password: password.trim(),
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("admin_token", res.token);
        localStorage.setItem("admin_user", JSON.stringify(res.user));
      }

      router.push("/");
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid admin credentials or unauthorized account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setEmail("admin@perfectpic.in");
    setPassword("password123");
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await adminApi.login({
        email: "admin@perfectpic.in",
        password: "password123",
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("admin_token", res.token);
        localStorage.setItem("admin_user", JSON.stringify(res.user));
      }

      router.push("/");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in with admin account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-noir-950 flex flex-col items-center justify-center p-4 text-cream-50 font-sans">
      <div className="w-full max-w-md bg-cream-50 rounded-sm shadow-luxury-xl p-8 text-noir-900 border border-cream-300">
        <div className="text-center mb-6">
          <span className="font-display font-bold text-2xl tracking-[0.25em] uppercase text-noir-950">
            PerfectPic
          </span>
          <p className="text-xs text-noir-500 tracking-widest mt-1.5 uppercase font-medium">
            Admin Portal • perfectpic.in
          </p>
        </div>

        {/* 1-Click Test Admin Login */}
        <div className="mb-6 p-3.5 bg-amber-50/80 border border-amber-200 rounded-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Demo Admin Account
            </span>
          </div>
          <button
            type="button"
            onClick={handleQuickAdminLogin}
            disabled={isSubmitting}
            className="w-full py-2 px-3 bg-noir-900 hover:bg-noir-800 text-cream-50 rounded text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
          >
            <span>1-Click Admin Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <div className="text-[10px] text-noir-600 mt-2 text-center flex items-center justify-center gap-2">
            <span>admin@perfectpic.in</span>
            <span>•</span>
            <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">password123</code>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-noir-700 mb-1">
              Admin Email or Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@perfectpic.in"
                className="w-full pl-9 pr-3 py-2 border border-cream-300 rounded-sm bg-cream-50 text-noir-900 focus:outline-none focus:border-noir-950 text-sm"
              />
              <Mail className="w-4 h-4 text-noir-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-noir-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 border border-cream-300 rounded-sm bg-cream-50 text-noir-900 focus:outline-none focus:border-noir-950 text-sm"
              />
              <Lock className="w-4 h-4 text-noir-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-noir-950 text-cream-50 py-3 rounded-sm hover:bg-noir-900 transition-colors tracking-widest uppercase text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isSubmitting ? "Authenticating..." : "Sign In to Admin"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-cream-200 text-center">
          <a
            href={getStorefrontUrl()}
            className="text-xs text-noir-500 hover:text-noir-900 font-medium"
          >
            ← Back to Storefront
          </a>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-1.5 text-xs text-noir-500 tracking-wider uppercase">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Authorized Personnel Only</span>
      </div>
    </div>
  );
}
