'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function UploadRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();
    const target = `/upload/new-project${params ? `?${params}` : ''}`;
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F2EC]">
      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function UploadRootPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F4F2EC]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <UploadRedirect />
    </Suspense>
  );
}
