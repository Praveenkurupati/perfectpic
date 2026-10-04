"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, KeyRound, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { api } from "@/lib/api";
import OAuthButtons from "@/components/auth/OAuthButtons";
import { BrandLogo } from "@/components/brand/BrandLogo";

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
  const [activeTab, setActiveTab] = useState<"otp" | "login" | "signup">("otp");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");

  // OTP State
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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

  const handleSendOtp = async (emailToSend: string) => {
    if (!emailToSend || !emailToSend.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.sendOtp({ email: emailToSend.trim().toLowerCase() });
      setOtpSent(true);
      setSuccessMsg(res.message || `A verification code has been sent to ${emailToSend}. Please check your inbox.`);
      setCountdown(60);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send verification code. Please check your email and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (activeTab === "otp") {
      if (!otpSent) {
        await handleSendOtp(otpEmail);
      } else {
        if (!otpCode || otpCode.trim().length < 4) {
          setErrorMsg("Please enter the verification code sent to your email.");
          return;
        }
        setIsSubmitting(true);
        try {
          const res = await api.verifyOtp({
            email: otpEmail.trim().toLowerCase(),
            otp: otpCode.trim(),
          });
          login(res.user, res.token);
          router.push(redirectUrl);
        } catch (err: any) {
          setErrorMsg(err.message || "Invalid or expired verification code.");
        } finally {
          setIsSubmitting(false);
        }
      }
    } else if (activeTab === "signup") {
      if (!signupName.trim() || !signupEmail.trim() || !password) {
        setErrorMsg("Please fill in all registration fields.");
        return;
      }
      setIsSubmitting(true);
      try {
        const res = await api.signup({
          name: signupName.trim(),
          email: signupEmail.trim().toLowerCase(),
          password: password.trim(),
        });
        login(res.user, res.token);
        router.push(redirectUrl);
      } catch (err: any) {
        setErrorMsg(err.message || "Registration failed. An account with this email may already exist.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Password login
      if (!identifier.trim() || !password) {
        setErrorMsg("Please enter your email and password.");
        return;
      }
      setIsSubmitting(true);
      try {
        const res = await api.login({
          identifier: identifier.trim().toLowerCase(),
          password: password.trim(),
        });
        login(res.user, res.token);
        router.push(redirectUrl);
      } catch (err: any) {
        setErrorMsg(err.message || "Invalid email or password.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans text-noir-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" aria-label="PerfectPic Homepage" className="inline-block">
          <BrandLogo variant="light" height={42} className="h-10 w-auto inline-block" />
        </Link>
        <p className="mt-2 text-xs uppercase tracking-widest text-noir-500 font-medium">
          {redirectUrl.includes("checkout") 
            ? "Sign in to complete your photobook order" 
            : "Access your archival projects & orders"}
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-luxury-md border border-cream-200 rounded-sm sm:px-10">
          {/* OAuth 2.0 Fast Sign In */}
          <OAuthButtons
            redirectUrl={redirectUrl}
            onError={(msg) => setErrorMsg(msg)}
          />

          {/* Authentication Mode Tabs */}
          <div className="flex border-b border-cream-200 mb-6">
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

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-sm flex items-start gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
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
                        onClick={() => { setOtpSent(false); setOtpCode(""); }}
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
                        autoFocus
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="••••••"
                        className="w-full pl-9 pr-3 py-2 border border-cream-300 rounded-sm bg-cream-50 text-noir-900 focus:outline-none focus:border-noir-900 text-sm tracking-widest font-mono text-center text-lg font-bold"
                      />
                      <KeyRound className="w-4 h-4 text-noir-400 absolute left-3 top-3.5" />
                    </div>

                    <div className="mt-2 flex justify-between items-center text-[11px] text-noir-500">
                      <span>Didn&apos;t receive code?</span>
                      {countdown > 0 ? (
                        <span className="text-noir-400">Resend in {countdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendOtp(otpEmail)}
                          disabled={isSubmitting}
                          className="text-foil-gold hover:underline font-medium inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Resend OTP</span>
                        </button>
                      )}
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
                      <span>{otpSent ? "Verify & Continue" : "Send Verification Code"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </>
            ) : activeTab === "signup" ? (
              <>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-noir-700 font-semibold mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3 py-2 border border-cream-300 rounded-sm bg-cream-50 text-noir-900 focus:outline-none focus:border-noir-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-noir-700 font-semibold mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="e.g. yourname@example.com"
                      className="w-full pl-9 pr-3 py-2 border border-cream-300 rounded-sm bg-cream-50 text-noir-900 focus:outline-none focus:border-noir-900 text-sm"
                    />
                    <Mail className="w-4 h-4 text-noir-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-noir-700 font-semibold mb-1">
                    Create Password
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
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account & Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-noir-700 font-semibold mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. yourname@example.com"
                      className="w-full pl-9 pr-3 py-2 border border-cream-300 rounded-sm bg-cream-50 text-noir-900 focus:outline-none focus:border-noir-900 text-sm"
                    />
                    <Mail className="w-4 h-4 text-noir-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs uppercase tracking-wider text-noir-700 font-semibold">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => { setActiveTab("otp"); setOtpEmail(identifier); }}
                      className="text-[11px] text-foil-gold hover:underline"
                    >
                      Forgot? Use OTP
                    </button>
                  </div>
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
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In & Continue</span>
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
