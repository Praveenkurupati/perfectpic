"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, ShieldCheck, User, AlertCircle, Loader2, Phone } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { api } from "@/lib/api";
import OAuthButtons from "@/components/auth/OAuthButtons";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || searchParams.get("returnUrl") || "/";

  const { login } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await api.signup({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim(),
      });

      login(res.user, res.token);
      router.push(redirectUrl);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account. Please check your information.");
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
          Create your account
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-luxury-md border border-cream-200 rounded-sm sm:px-10">
          {/* OAuth 2.0 Fast Sign Up */}
          <OAuthButtons
            redirectUrl={redirectUrl}
            onError={(msg) => setErrorMsg(msg)}
          />

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-noir-700 font-semibold mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full pl-9 pr-3 py-2 border border-cream-300 rounded-sm bg-cream-50 text-noir-900 focus:outline-none focus:border-noir-900 text-sm"
                />
                <User className="w-4 h-4 text-noir-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-noir-700 font-semibold mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@example.com"
                  className="w-full pl-9 pr-3 py-2 border border-cream-300 rounded-sm bg-cream-50 text-noir-900 focus:outline-none focus:border-noir-900 text-sm"
                />
                <Mail className="w-4 h-4 text-noir-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-noir-700 font-semibold mb-1">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 border border-cream-300 rounded-sm bg-cream-50 text-noir-900 focus:outline-none focus:border-noir-900 text-sm"
                />
                <Phone className="w-4 h-4 text-noir-400 absolute left-3 top-2.5" />
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
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2 border border-cream-300 rounded-sm bg-cream-50 text-noir-900 focus:outline-none focus:border-noir-900 text-sm"
                />
                <Lock className="w-4 h-4 text-noir-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-5 flex items-center justify-center gap-2 bg-noir-950 text-cream-50 py-3 px-4 rounded-sm font-medium text-xs uppercase tracking-widest hover:bg-noir-900 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Sign In link */}
          <div className="mt-6 pt-4 border-t border-cream-200 text-center">
            <p className="text-xs text-noir-600">
              Already have an account?{" "}
              <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`} className="text-noir-950 font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-noir-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>256-bit SSL encrypted secure checkout</span>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream-50 flex items-center justify-center">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
