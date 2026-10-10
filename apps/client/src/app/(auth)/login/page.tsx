import { Suspense } from 'react';
import UnifiedAuthScreen from '@/components/auth/UnifiedAuthScreen';

export const metadata = {
  title: 'Sign In — PerfectPic',
  description: 'Sign in to your PerfectPic account to continue customizing and ordering heirloom photobooks.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-sm text-neutral-500">loading...</div>}>
      <UnifiedAuthScreen initialMode="login" />
    </Suspense>
  );
}
