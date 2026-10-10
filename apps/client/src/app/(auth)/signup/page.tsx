import { Suspense } from 'react';
import UnifiedAuthScreen from '@/components/auth/UnifiedAuthScreen';

export const metadata = {
  title: 'Create Account — PerfectPic',
  description: 'Create an account to begin designing luxury heirloom photobooks with PerfectPic.',
};

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-sm text-neutral-500">loading...</div>}>
      <UnifiedAuthScreen initialMode="signup" />
    </Suspense>
  );
}
