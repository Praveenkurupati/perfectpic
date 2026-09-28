"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle, KeyRound, CheckCircle2, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { api } from "@/lib/api";
import OAuthButtons from "@/components/auth/OAuthButtons";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || searchParams.get("returnUrl") || "/";

  const { login } = useAuthStore();
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"login" | "otp" | "signup">("login");
  const [signupName, setSignupName] = useState("");

  // OTP State
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [detectedDevOtp, setDetectedDevOtp] = useState<string | null>(null);

  // Check for OAuth redirect token
  useEffect(() => {
    const oauthToken = searchParams.get("oauth_token");
    if (oauthToken) {
      if (typeof window !== "undefined") {
        localStorage.setItem("pp_token", oauthToken);
        localStorage.setItem("token", oauthToken);
      }
      api.getMe()
        .then((res) => {
          if (res && res.user) {
            login(res.user, oauthToken);
            router.push(redirectUrl);
          }
        })
        .catch((err) => {
          console.error("OAuth token verification failed:", err);
          setErrorMsg("Failed to complete OAuth authentication. Please try again.");
        });
    }
  }, [searchParams, login, redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (activeTab === "login") {
        const res = await api.login({
          identifier: identifier.trim(),
          password: password.trim() || "password123",
        });
        login(res.user, res.token);
        router.push(redirectUrl);
      } else if (activeTab === "otp") {
        if (!otpSent) {
          // Step 1: Send OTP
          const res = await api.sendOtp({ email: otpEmail.trim() });
          setOtpSent(true);
          setSuccessMsg(res.message || "Verification code sent to your email!");
          if (res.devOtp) {
            setDetectedDevOtp(res.devOtp);
            setOtpCode(res.devOtp); // Auto-fill for convenience
          }
        } else {
          // Step 2: Verify OTP
          const res = await api.verifyOtp({
            email: otpEmail.trim(),
            otp: otpCode.trim(),
          });
          login(res.user, res.token);
          router.push(redirectUrl);
        }
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
      setErrorMsg(err.message || "Authentication failed. Please verify your details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (email: string) => {
    setIdentifier(email);
    setPassword("password123");
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

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
          {/* OAuth 2.0 Fast Sign In */}
          <OAuthButtons
            redirectUrl={redirectUrl}
            onError={(msg) => setErrorMsg(msg)}
          />

          {/* Tabs */}
          <div className="flex border-b border-cream-200 mb-6">
            <button
              type="button"
              onClick={() => { setActiveTab("login"); setErrorMsg(""); setSuccessMsg(""); }}
              className={`flex-1 pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors text-center ${
                activeTab === "login"
                  ? "border-b-2 border-noir-950 text-noir-950"
                  : "text-noir-400 hover:text-noir-700"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("otp"); setErrorMsg(""); setSuccessMsg(""); }}
              className={`flex-1 pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors text-center ${
                activeTab === "otp"
                  ? "border-b-2 border-noir-950 text-noir-950"
                  : "text-noir-400 hover:text-noir-700"
              }`}
            >
              Email OTP
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("signup"); setErrorMsg(""); setSuccessMsg(""); }}
              className={`flex-1 pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors text-center ${
                activeTab === "signup"
                  ? "border-b-2 border-noir-950 text-noir-950"
                  : "text-noir-400 hover:text-noir-700"
              }`}
            >
              Register
            </button>
          </div>

          {/* Quick Login Test Accounts */}
          {activeTab === "login" && (
            <div className="mb-6 p-3.5 bg-cream-100/70 border border-cream-300 rounded-sm">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-noir-800 uppercase tracking-wider mb-2">
                <UserCheck className="w-3.5 h-3.5 text-foil-gold" />
                <span>Quick Test Sign In (Seeded Accounts):</span>
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

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-sm flex items-start gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <span>{successMsg}</span>
                {detectedDevOtp && (
                  <p className="mt-1 font-mono font-semibold text-emerald-900">
                    Auto-detected Code: {detectedDevOtp}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "otp" ? (
              <>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-noir-700 font-semibold mb-1">
                    Your Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      disabled={otpSent}
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      placeholder="e.g. yourname@example.com"
                      className="w-full pl-9 pr-3 py-2 border border-cream-300 rounded-sm bg-cream-50 text-noir-900 focus:outline-none focus:border-noir-900 text-sm disabled:opacity-60"
                    />
                    <Mail className="w-4 h-4 text-noir-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {otpSent && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs uppercase tracking-wider text-noir-700 font-semibold">
                        Enter 6-Digit Code
                      </label>
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setDetectedDevOtp(null); }}
                        className="text-[11px] text-foil-gold hover:underline"
                      >
                        Change Email
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        className="w-full pl-9 pr-3 py-2 border border-cream-300 rounded-sm bg-cream-50 text-noir-900 focus:outline-none focus:border-noir-900 text-sm tracking-widest font-mono text-center text-lg font-bold"
                      />
                      <KeyRound className="w-4 h-4 text-noir-400 absolute left-3 top-3.5" />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-noir-950 text-cream-50 py-3 px-4 rounded-sm font-medium text-xs uppercase tracking-widest hover:bg-noir-900 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>{otpSent ? "Verify & Sign In" : "Send Verification Code"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
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
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Please wait...</span>
                    </>
                  ) : (
                    <>
                      <span>{activeTab === "login" ? "Sign In & Continue" : "Create Account"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </>
            )}
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
