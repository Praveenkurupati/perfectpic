// apps/client/src/components/providers/AnalyticsTracker.tsx
"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics";
import { initMetaPixel, trackMetaPageView } from "@/lib/metaPixel";

function AnalyticsTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize Meta Pixel on client mount
  useEffect(() => {
    initMetaPixel();
  }, []);

  useEffect(() => {
    if (pathname) {
      const fullPath = searchParams && searchParams.toString() 
        ? `${pathname}?${searchParams.toString()}` 
        : pathname;
      trackPageView(fullPath);
      trackMetaPageView();
    }
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTrackerInner />
    </Suspense>
  );
}
