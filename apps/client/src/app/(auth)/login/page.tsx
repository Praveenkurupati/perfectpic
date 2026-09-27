"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { api } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || searchParams.get("returnUrl") || "/";

  const { login } = useAuthStore();
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [signupName, setSignupName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      if (activeTab === "login") {
        const res = await api.login({
          identifier: identifier.trim(),
          password: password.trim() || "password123",
        });
        login(res.user, res.token);
        router.push(redirectUrl);
      } else {
        const res = await api.signup({
          name: signupName.trim(),
          email: identifier.trim(),
          password: password.trim(),
        });
        login(res.user, res.token);
        router.push(redirectUrl);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (email: string) => {
    setIdentifier(email);
    setPassword("password123");
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await api.login({
        identifier: email,
        password: "password123",
      });
      login(res.user, res.token);
      router.push(redirectUrl);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in with quick account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans text-noir-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" className="inline-block">
          <span className="font-display font-bold text-3xl md:text-4xl tracking-[0.3em] uppercase text-noir-950">
            PerfectPic
          </span>
        </Link>
        <p className="mt-2 text-xs uppercase tracking-widest text-noir-500 font-medium">
          {redirectUrl.includes("checkout") 
            ? "Sign in to complete your order" 
            : "Sign in to your account"}
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-luxury-md border border-cream-200 rounded-sm sm:px-10">
          {/* Tabs */}
          <div className="flex border-b border-cream-200 mb-6">
            <button
              type="button"
              onClick={() => { setActiveTab("login"); setErrorMsg(""); }}
              className={`flex-1 pb-3 text-sm font-semibold tracking-wider uppercase transition-colors text-center ${
                activeTab === "login"
                  ? "border-b-2 border-noir-950 text-noir-950"
                  : "text-noir-400 hover:text-noir-700"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("signup"); setErrorMsg(""); }}
              className={`flex-1 pb-3 text-sm font-semibold tracking-wider uppercase transition-colors text-center ${
                activeTab === "signup"
                  ? "border-b-2 border-noir-950 text-noir-950"
                  : "text-noir-400 hover:text-noir-700"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Quick Login Test Accounts */}
          {activeTab === "login" && (
            <div className="mb-6 p-3.5 bg-cream-100/70 border border-cream-300 rounded-sm">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-noir-800 uppercase tracking-wider mb-2">
                <UserCheck className="w-3.5 h-3.5 text-foil-gold" />
                <span>Quick Test Sign In (Seeded Users):</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin("user1@perfectpic.in")}
                  className="px-2.5 py-1.5 bg-white hover:bg-cream-200 border border-cream-300 text-xs font-medium text-noir-800 rounded transition-colors text-center"
                >
                  User 1
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("user2@perfectpic.in")}
                  className="px-2.5 py-1.5 bg-white hover:bg-cream-200 border border-cream-300 text-xs font-medium text-noir-800 rounded transition-colors text-center"
                >
                  User 2
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("admin@perfectpic.in")}
                  className="px-2.5 py-1.5 bg-white hover:bg-cream-200 border border-cream-300 text-xs font-medium text-foil-gold font-semibold rounded transition-colors text-center"
                >
                  Admin
                </button>
              </div>
              <p className="text-[10px] text-noir-500 mt-2 text-center">
                Pre-configured password: <code className="bg-cream-200 px-1 py-0.5 rounded font-mono">password123</code>
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "signup" && (
              <div>
                <label className="block text-xs uppercase tracking-wider text-noir-700 font-semibold mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 border border-cream-300 rounded-sm bg-cream-50 text-noir-900 focus:outline-none focus:border-noir-900 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider text-noir-700 font-semibold mb-1">
                Email or Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="user1@perfectpic.in or user1"
                  className="w-full pl-9 pr-3 py-2 border border-cream-300 rounded-sm bg-cream-50 text-noir-900 focus:outline-none focus:border-noir-900 text-sm"
                />
                <Mail className="w-4 h-4 text-noir-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-noir-700 font-semibold mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-cream-300 rounded-sm bg-cream-50 text-noir-900 focus:outline-none focus:border-noir-900 text-sm"
                />
                <Lock className="w-4 h-4 text-noir-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-noir-950 text-cream-50 py-3 px-4 rounded-sm font-medium text-xs uppercase tracking-widest hover:bg-noir-900 transition-colors disabled:opacity-50"
            >
              <span>{isSubmitting ? "Please wait..." : activeTab === "login" ? "Sign In & Continue" : "Create Account"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Guest browsing notice */}
          <div className="mt-6 pt-4 border-t border-cream-200 text-center">
            <p className="text-xs text-noir-500">
              Just browsing?{" "}
              <Link href="/" className="text-noir-900 font-medium hover:underline">
                Return to Storefront
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-noir-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>256-bit encrypted secure session</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream-50 flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
