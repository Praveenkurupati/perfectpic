'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEffect } from 'react';

export default function AuthPage() {
  const router = useRouter();
  const { identifier, setIdentifier, otpSent, setOtpSent, countdownTimer, decrementTimer } = useAuthStore();

  useEffect(() => {
    let timer: any;
    if (otpSent && countdownTimer > 0) {
      timer = setInterval(decrementTimer, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdownTimer, decrementTimer]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpSent(true);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4 font-sans text-noir-900">
      <div className="max-w-md w-full bg-white p-8 md:p-12 rounded-sm shadow-xl border border-cream-200">
        <h1 className="font-serif text-3xl mb-2 text-center">Almost There!</h1>
        <p className="text-center text-noir-600 text-sm mb-8">Verify your identity to save your project securely.</p>

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">Mobile or Email</label>
              <input 
                type="text" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="+91 98765 43210" 
                className="w-full border-b-2 border-cream-300 px-0 py-3 bg-transparent focus:outline-none focus:border-foil-gold transition-colors text-lg"
                required
              />
            </div>
            <button type="submit" className="w-full bg-noir-950 text-cream-50 py-4 rounded-sm font-medium tracking-wide hover:bg-noir-900">
              Send OTP
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-4 text-center">Enter 6-digit OTP</label>
              <div className="flex justify-between gap-2">
                {[1,2,3,4,5,6].map(i => (
                  <input 
                    key={i} 
                    type="text" 
                    maxLength={1} 
                    className="w-12 h-14 border border-cream-300 rounded-sm text-center text-2xl focus:border-foil-gold focus:outline-none bg-cream-50" 
                  />
                ))}
              </div>
            </div>
            
            <button type="submit" className="w-full bg-noir-950 text-cream-50 py-4 rounded-sm font-medium tracking-wide hover:bg-noir-900">
              Verify & Continue
            </button>

            <div className="text-center text-sm">
              {countdownTimer > 0 ? (
                <span className="text-noir-500">Resend OTP in {countdownTimer}s</span>
              ) : (
                <button type="button" onClick={() => setOtpSent(true)} className="text-foil-gold hover:underline">Resend OTP</button>
              )}
            </div>
          </form>
        )}

        <div className="mt-10 pt-8 border-t border-cream-200">
          <p className="text-center text-xs text-noir-500 mb-4 uppercase tracking-widest">Or continue with</p>
          <div className="space-y-3">
            <button className="w-full py-3 border border-cream-300 rounded-sm flex items-center justify-center gap-3 hover:bg-cream-50 transition-colors">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              <span className="text-sm font-medium">Continue with Google</span>
            </button>
            <button className="w-full py-3 border border-cream-300 rounded-sm flex items-center justify-center gap-3 hover:bg-cream-50 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.19 2.31-.88 3.5-.8 1.56.12 2.89.69 3.9 1.6-3.15 2-2.22 6.09.83 7.23-.74 1.74-1.64 3.48-3.31 4.14zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              <span className="text-sm font-medium">Continue with Apple</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-noir-400 mt-8">Your photobook project is safe and will be linked to your account.</p>
      </div>
    </div>
  );
}
