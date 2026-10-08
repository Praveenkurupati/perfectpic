"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getImageProxyUrl } from "@/lib/urls";

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  containerClassName?: string;
  shimmerClassName?: string;
  fallbackSrc?: string;
  eager?: boolean;
}

export function LazyImage({
  src,
  alt,
  className,
  containerClassName,
  shimmerClassName,
  fallbackSrc,
  eager = false,
  ...rest
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setIsLoaded(false);
    setIsError(false);
    setCurrentSrc(src);
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden w-full h-full", containerClassName)}>
      {/* Shimmer Placeholder Skeleton */}
      {!isLoaded && !isError && (
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] animate-pulse",
            shimmerClassName
          )}
          aria-hidden="true"
        />
      )}

      {/* Main Image with Async Decoding and Native Lazy Loading */}
      <img
        src={isError && fallbackSrc ? fallbackSrc : currentSrc}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (!isError && fallbackSrc && currentSrc !== fallbackSrc) {
            setIsError(true);
            setCurrentSrc(fallbackSrc);
          } else if (!isError && currentSrc && !currentSrc.includes('/api/v1/upload/proxy') && !currentSrc.startsWith('data:') && !currentSrc.startsWith('blob:')) {
            setIsError(true);
            setCurrentSrc(getImageProxyUrl(currentSrc));
          } else {
            setIsLoaded(true);
          }
        }}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-500 ease-out",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        {...rest}
      />
    </div>
  );
}

export default LazyImage;
