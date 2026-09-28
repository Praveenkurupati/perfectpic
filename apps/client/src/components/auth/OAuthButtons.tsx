"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X, Shield, Check, Info } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";

interface OAuthButtonsProps {
  redirectUrl?: string;
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

export function GoogleLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function AppleLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 170 170" fill="currentColor">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.85-11.97-14.42-6.53-10.12-11.53-21.43-15.01-33.91-3.48-12.49-5.23-24.38-5.23-35.68 0-14.36 3.59-26.43 10.77-36.21 7.18-9.79 16.32-14.77 27.42-14.95 4.8 0 10.12 1.25 15.97 3.75 5.86 2.5 9.79 3.86 11.8 4.09 1.74-.23 5.92-1.63 12.54-4.2 6.63-2.58 12.19-3.75 16.69-3.52 12.85.65 23.3 5.44 31.35 14.36-11.1 6.75-16.54 16.22-16.32 28.41.22 9.58 3.92 17.63 11.09 24.16 7.18 6.53 15.78 10.23 25.8 11.1-2.18 6.53-4.9 13.06-8.17 19.59zM119.22 32.74c0-7.18 2.61-13.93 7.84-20.25 5.22-6.31 11.64-10.45 19.26-12.41.22 1.3.33 2.5.33 3.59 0 7.18-2.72 14.04-8.16 20.57-5.44 6.53-11.97 10.45-19.59 11.75-.43-1.09-.68-2.18-.68-3.25z" />
    </svg>
  );
}

export default function OAuthButtons({ redirectUrl = "/", onSuccess, onError }: OAuthButtonsProps) {
  const router = useRouter();
  const { login } = useAuthStore();

  const [loadingProvider, setLoadingProvider] = useState<"google" | "apple" | null>(null);
  const [modalProvider, setModalProvider] = useState<"google" | "apple" | null>(null);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");

  const demoAccounts = [
    {
      name: "Praveen Kurupati",
      email: "praveen@perfectpic.in",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop",
      tag: "Platform Owner",
    },
    {
      name: "Priya Sharma",
      email: "priya@example.com",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop",
      tag: "Verified Explorer",
    },
    {
      name: "Rahul Verma",
      email: "rahul@example.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop",
      tag: "Frequent Buyer",
    },
  ];

  const handleOAuthClick = async (provider: "google" | "apple") => {
    try {
      setLoadingProvider(provider);

      // Check if real client ID is configured in backend / client
      const config = await api.getOAuthConfig().catch(() => null);
      const isProviderEnabled = provider === "google" ? config?.google?.enabled : config?.apple?.enabled;

      if (isProviderEnabled) {
        // Redirect to real Google/Apple OAuth endpoint
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        window.location.href = `${apiBase}/api/v1/auth/${provider}?redirect=${encodeURIComponent(redirectUrl)}`;
      } else {
        // Open Dev OAuth Interactive Selector
        setLoadingProvider(null);
        setModalProvider(provider);
      }
    } catch (err: any) {
      setLoadingProvider(null);
      if (onError) onError(err.message || "Failed to initialize OAuth");
    }
  };

  const executeOAuthLogin = async (email: string, name: string, avatar?: string) => {
    if (!modalProvider) return;
    try {
      setLoadingProvider(modalProvider);
      const res = await api.oauthLogin({
        provider: modalProvider,
        email,
        name,
        avatar,
        providerId: `${modalProvider}_${Date.now()}`,
      });

      login(res.user, res.token);
      setModalProvider(null);
      if (onSuccess) onSuccess();
      router.push(redirectUrl);
    } catch (err: any) {
      if (onError) onError(err.message || "OAuth login failed");
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={() => handleOAuthClick("google")}
          disabled={loadingProvider !== null}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-cream-50 text-noir-900 border border-cream-300 rounded-sm font-medium text-xs sm:text-sm tracking-wide transition-all shadow-xs hover:border-cream-400 disabled:opacity-60 group"
        >
          {loadingProvider === "google" ? (
            <Loader2 className="w-4 h-4 animate-spin text-foil-gold" />
          ) : (
            <GoogleLogo className="w-4 h-4 group-hover:scale-105 transition-transform" />
          )}
          <span>Continue with Google</span>
        </button>

        {/* Apple OAuth Button */}
        <button
          type="button"
          onClick={() => handleOAuthClick("apple")}
          disabled={loadingProvider !== null}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-noir-950 hover:bg-noir-900 text-cream-50 border border-noir-950 rounded-sm font-medium text-xs sm:text-sm tracking-wide transition-all shadow-xs disabled:opacity-60 group"
        >
          {loadingProvider === "apple" ? (
            <Loader2 className="w-4 h-4 animate-spin text-foil-gold" />
          ) : (
            <AppleLogo className="w-4 h-4 group-hover:scale-105 transition-transform" />
          )}
          <span>Continue with Apple</span>
        </button>
      </div>

      {/* Luxury Divider */}
      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-cream-200"></div>
        </div>
        <span className="relative px-3 bg-white text-[11px] uppercase tracking-widest text-noir-400 font-semibold">
          or continue with email
        </span>
      </div>

      {/* Interactive OAuth Account Chooser Modal (for Dev & Instant Testing) */}
      {modalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-md max-w-md w-full p-6 shadow-2xl border border-cream-300 space-y-4">
            <div className="flex justify-between items-start border-b border-cream-200 pb-3">
              <div className="flex items-center gap-2.5">
                {modalProvider === "google" ? (
                  <GoogleLogo className="w-5 h-5" />
                ) : (
                  <AppleLogo className="w-5 h-5 text-noir-950" />
                )}
                <div>
                  <h3 className="text-sm font-semibold text-noir-950">
                    Sign in with {modalProvider === "google" ? "Google" : "Apple"}
                  </h3>
                  <p className="text-[11px] text-noir-500">
                    Choose an account to continue to PerfectPic
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalProvider(null)}
                className="text-noir-400 hover:text-noir-900 p-1 rounded-full hover:bg-cream-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick One-Click Accounts */}
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-noir-400 font-semibold">
                Select an account:
              </p>
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  disabled={loadingProvider !== null}
                  onClick={() => executeOAuthLogin(acc.email, acc.name, acc.avatar)}
                  className="w-full flex items-center justify-between p-3 rounded-sm border border-cream-200 hover:border-foil-gold hover:bg-cream-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={acc.avatar}
                      alt={acc.name}
                      className="w-8 h-8 rounded-full object-cover border border-cream-300"
                    />
                    <div>
                      <div className="text-xs font-semibold text-noir-900 group-hover:text-foil-gold transition-colors">
                        {acc.name}
                      </div>
                      <div className="text-[11px] text-noir-500 font-mono">{acc.email}</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-cream-100 text-noir-600 px-2 py-0.5 rounded-full border border-cream-200 font-medium">
                    {acc.tag}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Email Option */}
            <div className="pt-2 border-t border-cream-200">
              <p className="text-[11px] uppercase tracking-wider text-noir-400 font-semibold mb-2">
                Or enter any {modalProvider === "google" ? "Google" : "Apple"} ID:
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-cream-300 rounded-sm text-xs bg-cream-50 text-noir-900 focus:outline-none focus:border-noir-900"
                />
                <button
                  disabled={!customEmail || loadingProvider !== null}
                  onClick={() => executeOAuthLogin(customEmail, customName || customEmail.split("@")[0] || "User")}
                  className="px-3 py-1.5 bg-noir-950 text-cream-50 rounded-sm text-xs font-medium hover:bg-noir-900 transition-colors disabled:opacity-50"
                >
                  Sign In
                </button>
              </div>
            </div>

            {/* Developer Notice Badge */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-sm flex items-start gap-2 text-[11px] text-amber-900 leading-relaxed">
              <Info className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
              <div>
                <span className="font-semibold">OAuth 2.0 Integration Ready:</span> Currently running in testing mode with pre-configured keys in <code className="bg-amber-100 px-1 py-0.2 rounded font-mono text-[10px]">apps/backend/.env</code>. When you add your production Google & Apple credentials, this automatically connects directly to the live Google/Apple consent screen.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
