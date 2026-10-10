'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Mail, 
  Phone, 
  ShieldCheck, 
  RotateCcw 
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/urls';
import { GoogleLogo, AppleLogo } from './OAuthButtons';

interface UnifiedAuthScreenProps {
  initialMode?: 'login' | 'signup';
}

export default function UnifiedAuthScreen({ initialMode = 'login' }: UnifiedAuthScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || searchParams.get('returnUrl') || '/';

  const { login } = useAuthStore();

  // Authentication Mode & Method
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [step, setStep] = useState<'input' | 'otp' | 'password'>('input');

  // Input States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // OTP Verification States
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // OAuth Dev Modal State
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null);
  const [modalProvider, setModalProvider] = useState<'google' | 'apple' | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Format phone number with space: "98765 43210"
  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setPhoneNumber(formatPhone(e.target.value));
  };

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Check for OAuth redirect token in URL
  useEffect(() => {
    const oauthToken = searchParams.get('oauth_token');
    if (oauthToken) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pp_token', oauthToken);
        localStorage.setItem('token', oauthToken);
      }
      api.getMe()
        .then((res) => {
          if (res && res.user) {
            login(res.user, oauthToken);
            router.push(redirectUrl);
          }
        })
        .catch((err) => {
          console.error('OAuth token verification failed:', err);
          setErrorMsg('Failed to complete OAuth authentication. Please try again.');
        });
    }
  }, [searchParams, login, redirectUrl, router]);

  // 1. Send OTP (Phone or Email)
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const rawPhoneDigits = phoneNumber.replace(/\D/g, '');

    if (method === 'phone') {
      if (rawPhoneDigits.length < 10) {
        setErrorMsg('Please enter a valid 10-digit mobile number.');
        return;
      }
    } else {
      if (!email || !email.includes('@')) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const targetIdentifier = method === 'phone' ? `+91${rawPhoneDigits}` : email.trim().toLowerCase();
      const res = await api.sendOtp({
        identifier: targetIdentifier,
        phone: method === 'phone' ? `+91${rawPhoneDigits}` : undefined,
        email: method === 'email' ? email.trim().toLowerCase() : undefined,
        purpose: 'login',
      });

      setStep('otp');
      setCountdown(30);
      setOtpCode(['', '', '', '', '', '']);

      if (res.devOtp) {
        setDevOtp(res.devOtp);
        setSuccessMsg(`Verification code: ${res.devOtp}`);
      } else {
        setDevOtp(null);
        setSuccessMsg(res.message || `Verification code sent to ${targetIdentifier}`);
      }

      // Auto-focus first OTP input after transition
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const fullCode = otpCode.join('').trim();
    if (fullCode.length < 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    const rawPhoneDigits = phoneNumber.replace(/\D/g, '');
    const targetIdentifier = method === 'phone' ? `+91${rawPhoneDigits}` : email.trim().toLowerCase();

    setIsSubmitting(true);
    try {
      const res = await api.verifyOtp({
        identifier: targetIdentifier,
        phone: method === 'phone' ? `+91${rawPhoneDigits}` : undefined,
        email: method === 'email' ? email.trim().toLowerCase() : undefined,
        otp: fullCode,
      });

      login(res.user, res.token);
      router.push(redirectUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.login({
        identifier: email.trim().toLowerCase(),
        password: password.trim(),
      });
      login(res.user, res.token);
      router.push(redirectUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle single-digit input change with auto-focus advance
  const handleOtpDigitChange = (index: number, val: string) => {
    setErrorMsg('');
    const cleanDigit = val.replace(/\D/g, '').slice(-1);

    const newCode = [...otpCode];
    newCode[index] = cleanDigit;
    setOtpCode(newCode);

    // If typed a digit, focus next input
    if (cleanDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits entered, auto-verify
    if (cleanDigit && index === 5 && newCode.every((d) => d !== '')) {
      setTimeout(() => {
        handleAutoVerify(newCode.join(''));
      }, 50);
    }
  };

  const handleAutoVerify = async (code: string) => {
    const rawPhoneDigits = phoneNumber.replace(/\D/g, '');
    const targetIdentifier = method === 'phone' ? `+91${rawPhoneDigits}` : email.trim().toLowerCase();

    setIsSubmitting(true);
    try {
      const res = await api.verifyOtp({
        identifier: targetIdentifier,
        phone: method === 'phone' ? `+91${rawPhoneDigits}` : undefined,
        email: method === 'email' ? email.trim().toLowerCase() : undefined,
        otp: code,
      });
      login(res.user, res.token);
      router.push(redirectUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle backspace and paste in OTP boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newCode = [...otpCode];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || '';
    }
    setOtpCode(newCode);

    const focusIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[focusIdx]?.focus();

    if (pasted.length === 6) {
      handleAutoVerify(pasted);
    }
  };

  // Google OAuth Click Handler
  const handleOAuthClick = async (provider: 'google' | 'apple') => {
    try {
      setLoadingProvider(provider);
      const config = await api.getOAuthConfig().catch(() => null);
      const isProviderEnabled = provider === 'google' ? config?.google?.enabled : config?.apple?.enabled;

      if (isProviderEnabled) {
        const apiBase = getApiBaseUrl();
        window.location.href = `${apiBase}/api/v1/auth/${provider}?redirect=${encodeURIComponent(redirectUrl)}`;
      } else {
        setLoadingProvider(null);
        setModalProvider(provider);
      }
    } catch (err: any) {
      setLoadingProvider(null);
      setErrorMsg(err.message || 'Failed to initialize sign in. Please try again.');
    }
  };

  const executeOAuthLogin = async (eMail: string, userName: string, avatar?: string) => {
    if (!modalProvider) return;
    try {
      setLoadingProvider(modalProvider);
      const res = await api.oauthLogin({
        provider: modalProvider,
        email: eMail,
        name: userName,
        avatar,
        providerId: `${modalProvider}_${Date.now()}`,
      });
      login(res.user, res.token);
      setModalProvider(null);
      router.push(redirectUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'OAuth sign in failed. Please try again.');
    } finally {
      setLoadingProvider(null);
    }
  };

  const demoAccounts = [
    {
      name: 'Praveen Kurupati',
      email: 'praveen@perfectpic.in',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop',
      tag: 'Platform Owner',
    },
    {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop',
      tag: 'Verified Explorer',
    },
    {
      name: 'Rahul Verma',
      email: 'rahul@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop',
      tag: 'Frequent Collector',
    },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans text-neutral-900 select-none">
      {/* ======================================================== */}
      {/* LEFT PANEL: Deep Matte Black Brand Experience */}
      {/* ======================================================== */}
      <div className="w-full md:w-1/2 bg-[#121212] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 min-h-[220px] md:min-h-screen shrink-0 relative overflow-hidden">
        {/* Top-Left Brand Logo */}
        <div className="z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            {/* Squircle Book Icon Mark matching screenshot */}
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-xs transition-transform group-hover:scale-105">
              <div className="w-full h-full flex items-center justify-center gap-0.5">
                <div className="w-2.5 h-4 bg-black rounded-[2px]" />
                <div className="w-2.5 h-4 bg-black rounded-[2px]" />
              </div>
            </div>
            <span className="text-white font-bold text-xl sm:text-2xl tracking-tight">
              perfectpic
            </span>
          </Link>
        </div>

        {/* Bottom-Left Heirloom Headline matching screenshot */}
        <div className="mt-8 md:mt-auto pt-6 md:pt-16 z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-white leading-[1.12]">
            your memories deserve an<br className="hidden sm:inline" /> heirloom.
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base mt-4 font-normal leading-relaxed max-w-md">
            sign in to continue your book, track orders and reorder in a tap.
          </p>
        </div>

        {/* Subtle decorative background glow */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ======================================================== */}
      {/* RIGHT PANEL: Pure White Minimalist Authentication */}
      {/* ======================================================== */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-6 sm:p-10 lg:p-16 min-h-full">
        <div className="w-full max-w-[420px] py-4 sm:py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950">
              {step === 'otp' ? 'verify code.' : initialMode === 'signup' ? 'get started.' : 'welcome back.'}
            </h1>
            <p className="text-neutral-500 text-sm sm:text-[15px] mt-2 font-normal leading-normal">
              {step === 'otp' ? (
                <>
                  code sent to{' '}
                  <span className="font-semibold text-neutral-800">
                    {method === 'phone' ? `+91 ${phoneNumber}` : email}
                  </span>{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setStep('input');
                      setErrorMsg('');
                    }}
                    className="text-black font-semibold underline underline-offset-2 ml-1 text-xs"
                  >
                    edit
                  </button>
                </>
              ) : (
                'sign in or create an account to start designing.'
              )}
            </p>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Dev / Test OTP Helper Badge */}
          {devOtp && step === 'otp' && (
            <div 
              onClick={() => {
                const digits = devOtp.split('').slice(0, 6);
                setOtpCode(digits);
                handleAutoVerify(devOtp);
              }}
              className="mb-5 p-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-mono cursor-pointer flex items-center justify-between transition-colors"
              title="Click to automatically fill code"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-black" />
                <span>Test Code: <strong className="text-black tracking-widest">{devOtp}</strong></span>
              </div>
              <span className="text-[11px] font-sans font-semibold text-black underline">tap to fill</span>
            </div>
          )}

          {/* ==================================================== */}
          {/* STEP 1: INPUT MODE (Phone or Email) */}
          {/* ==================================================== */}
          {step === 'input' && (
            <div>
              {method === 'phone' ? (
                /* Phone Number Input Form */
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5 lowercase">
                      mobile number
                    </label>
                    <div className="relative flex items-center rounded-xl border border-neutral-300 focus-within:border-black focus-within:ring-1 focus-within:ring-black px-4 py-3.5 transition-all bg-white">
                      <span className="text-neutral-500 font-medium text-sm sm:text-base mr-3 select-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoFocus
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        placeholder="00000 00000"
                        maxLength={11}
                        className="w-full bg-transparent border-none p-0 text-sm sm:text-base font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-0 tracking-wide"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || phoneNumber.replace(/\D/g, '').length < 10}
                    className="w-full py-3.5 px-4 bg-black text-white rounded-full font-semibold text-sm tracking-wide shadow-xs hover:bg-neutral-900 active:scale-[0.99] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-white" />
                        <span>sending code...</span>
                      </>
                    ) : (
                      <span>send otp</span>
                    )}
                  </button>
                </form>
              ) : (
                /* Email Input Form */
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5 lowercase">
                      email address
                    </label>
                    <div className="rounded-xl border border-neutral-300 focus-within:border-black focus-within:ring-1 focus-within:ring-black px-4 py-3.5 transition-all bg-white">
                      <input
                        type="email"
                        autoFocus
                        value={email}
                        onChange={(e) => {
                          setErrorMsg('');
                          setEmail(e.target.value);
                        }}
                        placeholder="name@example.com"
                        className="w-full bg-transparent border-none p-0 text-sm sm:text-base font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !email.includes('@')}
                    className="w-full py-3.5 px-4 bg-black text-white rounded-full font-semibold text-sm tracking-wide shadow-xs hover:bg-neutral-900 active:scale-[0.99] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-white" />
                        <span>sending code...</span>
                      </>
                    ) : (
                      <span>send otp</span>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('password');
                        setErrorMsg('');
                      }}
                      className="text-xs text-neutral-500 hover:text-black transition-colors"
                    >
                      or sign in with password
                    </button>
                  </div>
                </form>
              )}

              {/* Minimal Divider matching screenshot: ─── or ─── */}
              <div className="relative my-6 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200" />
                </div>
                <span className="relative px-3 bg-white text-xs font-normal text-neutral-400 lowercase select-none">
                  or
                </span>
              </div>

              {/* Secondary Buttons matching screenshot */}
              <div className="space-y-3">
                {/* 1. Continue with Google */}
                <button
                  type="button"
                  onClick={() => handleOAuthClick('google')}
                  disabled={loadingProvider !== null}
                  className="w-full py-3.5 px-4 bg-white border border-neutral-900 text-neutral-900 rounded-full font-semibold text-sm hover:bg-neutral-50 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 shadow-2xs"
                >
                  {loadingProvider === 'google' ? (
                    <Loader2 size={16} className="animate-spin text-black" />
                  ) : (
                    <GoogleLogo className="w-4 h-4" />
                  )}
                  <span>continue with google</span>
                </button>

                {/* 2. Switch between Email & Phone */}
                {method === 'phone' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMethod('email');
                      setErrorMsg('');
                    }}
                    className="w-full py-3.5 px-4 bg-white border border-neutral-300 text-neutral-900 rounded-full font-semibold text-sm hover:bg-neutral-50 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5"
                  >
                    <span>continue with email</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMethod('phone');
                      setErrorMsg('');
                    }}
                    className="w-full py-3.5 px-4 bg-white border border-neutral-300 text-neutral-900 rounded-full font-semibold text-sm hover:bg-neutral-50 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5"
                  >
                    <span>continue with mobile number</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* STEP 2: OTP VERIFICATION */}
          {/* ==================================================== */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-2 lowercase text-center">
                  enter 6-digit verification code
                </label>
                {/* 6 Digit Input Boxes */}
                <div className="flex items-center justify-between gap-2 max-w-[320px] mx-auto" onPaste={handleOtpPaste}>
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otpCode[idx]}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-12 text-center text-lg font-bold text-neutral-950 bg-neutral-50 border border-neutral-300 focus:border-black focus:ring-1 focus:ring-black rounded-xl transition-all focus:outline-none"
                    />
                  ))}
                </div>
              </div>

              {/* Resend Countdown */}
              <div className="text-center text-xs text-neutral-500">
                {countdown > 0 ? (
                  <span>resend code in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="font-semibold text-black hover:underline"
                  >
                    resend code
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otpCode.some((d) => d === '')}
                className="w-full py-3.5 px-4 bg-black text-white rounded-full font-semibold text-sm tracking-wide shadow-xs hover:bg-neutral-900 active:scale-[0.99] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>verifying...</span>
                  </>
                ) : (
                  <span>verify & continue</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('input');
                    setErrorMsg('');
                  }}
                  className="text-xs text-neutral-500 hover:text-black inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft size={13} />
                  <span>back</span>
                </button>
              </div>
            </form>
          )}

          {/* ==================================================== */}
          {/* STEP 3: TRADITIONAL PASSWORD LOGIN */}
          {/* ==================================================== */}
          {step === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5 lowercase">
                  email address
                </label>
                <div className="rounded-xl border border-neutral-300 focus-within:border-black focus-within:ring-1 focus-within:ring-black px-4 py-3.5 transition-all bg-white">
                  <input
                    type="email"
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setErrorMsg('');
                      setEmail(e.target.value);
                    }}
                    placeholder="name@example.com"
                    className="w-full bg-transparent border-none p-0 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5 lowercase">
                  password
                </label>
                <div className="rounded-xl border border-neutral-300 focus-within:border-black focus-within:ring-1 focus-within:ring-black px-4 py-3.5 transition-all bg-white">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setErrorMsg('');
                      setPassword(e.target.value);
                    }}
                    placeholder="••••••••"
                    className="w-full bg-transparent border-none p-0 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !email || !password}
                className="w-full py-3.5 px-4 bg-black text-white rounded-full font-semibold text-sm tracking-wide shadow-xs hover:bg-neutral-900 active:scale-[0.99] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>signing in...</span>
                  </>
                ) : (
                  <span>sign in</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('input');
                    setErrorMsg('');
                  }}
                  className="text-xs text-neutral-500 hover:text-black inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft size={13} />
                  <span>use verification code instead</span>
                </button>
              </div>
            </form>
          )}

          {/* Footer Disclaimer matching screenshot */}
          <p className="text-[11px] sm:text-xs text-neutral-400 text-center leading-relaxed mt-10">
            by continuing you agree to our{' '}
            <Link href="/terms" className="text-neutral-500 hover:text-neutral-800 underline underline-offset-2">
              terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-neutral-500 hover:text-neutral-800 underline underline-offset-2">
              privacy policy
            </Link>
            . your photos stay private.
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DEV OAUTH MODAL (Interactive Selector for Testing) */}
      {/* ======================================================== */}
      {modalProvider && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <GoogleLogo className="w-5 h-5" />
                <h3 className="font-semibold text-sm text-neutral-900">
                  Select Google Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalProvider(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-black transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-neutral-500 mt-2 mb-4">
              Development OAuth Sandbox. Select a demo persona to authenticate:
            </p>

            <div className="space-y-2 mb-4">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => executeOAuthLogin(acc.email, acc.name, acc.avatar)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-neutral-200 hover:border-black hover:bg-neutral-50 transition-all text-left"
                >
                  <img src={acc.avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-900 truncate">{acc.name}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{acc.email}</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 shrink-0">
                    {acc.tag}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setModalProvider(null)}
              className="w-full py-2.5 text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
