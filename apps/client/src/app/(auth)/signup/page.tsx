"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, ShieldCheck, User, AlertCircle, Loader2, Phone, KeyRound, CheckCircle2, RotateCcw } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { api } from "@/lib/api";
import OAuthButtons from "@/components/auth/OAuthButtons";
import { BrandLogo } from "@/components/brand/BrandLogo";

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
  const [successMsg, setSuccessMsg] = useState("");

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async (targetEmail: string) => {
    if (!name.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!targetEmail || !targetEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (password && password.length < 6) {
      setErrorMsg("Password should be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.sendOtp({
        email: targetEmail.trim().toLowerCase(),
        name: name.trim(),
        purpose: "signup",
      });
      setOtpSent(true);
      if (res.devOtp) {
        setSuccessMsg(res.message ? `${res.message} (Test OTP: ${res.devOtp})` : `Verification code: ${res.devOtp}`);
        setOtpCode(res.devOtp);
      } else {
        setSuccessMsg(res.message || `A 6-digit verification code has been sent to ${targetEmail}. Please check your inbox.`);
      }
      setCountdown(60);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send verification code. Please check your email and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!otpSent) {
      await handleSendOtp(email);
      return;
    }

    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMsg("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.signup({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password: password.trim() || undefined,
        otp: otpCode.trim(),
      });

      if (res.user && res.token) {
        login(res.user, res.token);
        router.push(redirectUrl);
      } else {
        throw new Error("Registration could not be completed. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid or expired verification code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans text-noir-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" aria-label="PerfectPic Homepage" className="inline-block">
          <BrandLogo variant="light" height={42} className="h-10 w-auto inline-block" />
        </Link>
        <p className="mt-2 text-xs uppercase tracking-widest text-noir-500 font-medium">
          Create your archival photobook account
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-luxury-md border border-cream-200 rounded-sm sm:px-10">
          {!otpSent && (
            <>
              {/* OAuth 2.0 Fast Sign Up */}
              <OAuthButtons
                redirectUrl={redirectUrl}
                onError={(msg) => setErrorMsg(msg)}
              />
              
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-cream-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-noir-400 font-semibold tracking-wider">
                    Or register with email OTP
                  </span>
                </div>
              </div>
            </>
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
              <span>{successMsg}</span>
            </div>
          )}

          {/* Registration Form with Email OTP verification */}
          <form onSubmit={handleVerifyAndRegister} className="space-y-4">
            {!otpSent ? (
              <>
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
                    Email Address <span className="text-foil-gold">* (Will receive OTP)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. yourname@example.com"
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
                    Password (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Optional — you can always log in via Email OTP"
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
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="p-3 bg-cream-100 rounded-sm border border-cream-300 mb-2">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-noir-500">Verifying: </span>
                      <span className="font-semibold text-noir-950">{email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtpCode(""); }}
                      className="text-foil-gold hover:underline font-medium text-[11px]"
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-noir-700 font-semibold mb-1">
                    Enter 6-Digit Email Verification Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      autoFocus
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••••"
                      className="w-full pl-9 pr-3 py-3 border border-cream-300 rounded-sm bg-cream-50 text-noir-900 focus:outline-none focus:border-noir-900 tracking-widest font-mono text-center text-2xl font-bold"
                    />
                    <KeyRound className="w-4 h-4 text-noir-400 absolute left-3 top-4" />
                  </div>

                  <div className="mt-2 flex justify-between items-center text-[11px] text-noir-500">
                    <span>Didn&apos;t receive email?</span>
                    {countdown > 0 ? (
                      <span className="text-noir-400">Resend in {countdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp(email)}
                        disabled={isSubmitting}
                        className="text-foil-gold hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Resend OTP</span>
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otpCode.length < 4}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-noir-950 text-cream-50 py-3.5 px-4 rounded-sm font-medium text-xs uppercase tracking-widest hover:bg-noir-900 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying & Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Complete Registration</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </>
            )}
          </form>

          {/* Sign In link */}
          <div className="mt-6 pt-4 border-t border-cream-200 text-center">
            <p className="text-xs text-noir-600">
              Already have an account?{" "}
              <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`} className="text-noir-950 font-semibold hover:underline">
                Sign In with Email OTP
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-noir-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>256-bit SSL encrypted secure authentication</span>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream-50 flex items-center justify-center font-serif">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
