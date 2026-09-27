'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login?redirect=/checkout');
  }, [router]);

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center font-sans text-noir-900">
      <div className="text-center">
        <p className="font-serif text-xl mb-2">Redirecting to Sign In...</p>
        <p className="text-xs text-noir-500 uppercase tracking-widest">Taking you to secure authentication</p>
      </div>
    </div>
  );
}
