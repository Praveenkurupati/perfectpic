"use client";

import React, { useId } from "react";

export interface BrandLogoProps {
  variant?: "light" | "dark";
  iconOnly?: boolean;
  showSubtitle?: boolean;
  className?: string;
  width?: number | string;
  height?: number | string;
}

export function BrandLogo({
  variant = "light",
  iconOnly = false,
  showSubtitle = true,
  className = "",
  width,
  height,
}: BrandLogoProps) {
  const rawId = useId();
  // Sanitize id for SVG attribute selectors
  const idPrefix = rawId.replace(/[^a-zA-Z0-9-_]/g, "");
  const grad1Id = `ppGrad1_${idPrefix}`;
  const grad2Id = `ppGrad2_${idPrefix}`;

  const isDark = variant === "dark";

  // Gradient 1: Deep Indigo to Purple
  const grad1Start = isDark ? "#818CF8" : "#6366F1";
  const grad1End = isDark ? "#C084FC" : "#A855F7";

  // Gradient 2: Vibrant Pink to Rose
  const grad2Start = isDark ? "#F472B6" : "#EC4899";
  const grad2End = isDark ? "#FB7185" : "#F43F5E";

  const textColor = isDark ? "#FFFFFF" : "#1F2937";
  const subtitleColor = isDark ? "#9CA3AF" : "#6B7280";

  if (iconOnly) {
    return (
      <svg
        viewBox="0 0 62 62"
        width={width || 36}
        height={height || 36}
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="PerfectPic Mark"
      >
        <defs>
          <linearGradient id={grad1Id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={grad1Start} />
            <stop offset="100%" stopColor={grad1End} />
          </linearGradient>
          <linearGradient id={grad2Id} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={grad2Start} />
            <stop offset="100%" stopColor={grad2End} />
          </linearGradient>
        </defs>
        <g transform="translate(0, 3)">
          <rect x="0" y="12" width="44" height="44" rx="12" fill={`url(#${grad1Id})`} />
          <rect x="18" y="0" width="44" height="44" rx="12" fill={`url(#${grad2Id})`} opacity="0.95" />
          <circle cx="40" cy="22" r="12" fill="#ffffff" />
          <circle cx="40" cy="22" r="4" fill={`url(#${grad1Id})`} />
        </g>
      </svg>
    );
  }

  const viewBox = showSubtitle ? "0 0 380 76" : "0 0 380 62";
  const defaultHeight = showSubtitle ? 40 : 34;

  return (
    <svg
      viewBox={viewBox}
      width={width || "auto"}
      height={height || defaultHeight}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="PerfectPic - Premium Photobooks"
    >
      <defs>
        <linearGradient id={grad1Id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={grad1Start} />
          <stop offset="100%" stopColor={grad1End} />
        </linearGradient>
        <linearGradient id={grad2Id} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={grad2Start} />
          <stop offset="100%" stopColor={grad2End} />
        </linearGradient>
      </defs>

      {/* Icon Mark: Overlapping Frames/Pages with Lens */}
      <g transform="translate(6, 10)">
        <rect x="0" y="12" width="44" height="44" rx="12" fill={`url(#${grad1Id})`} />
        <rect x="18" y="0" width="44" height="44" rx="12" fill={`url(#${grad2Id})`} opacity="0.95" />
        <circle cx="40" cy="22" r="12" fill="#ffffff" />
        <circle cx="40" cy="22" r="4" fill={`url(#${grad1Id})`} />
      </g>

      {/* Brand Typography */}
      <text
        x="84"
        y="47"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="34"
        fontWeight="900"
        fill={textColor}
        letterSpacing="-0.5"
      >
        PERFECT
      </text>
      <text
        x="234"
        y="47"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="34"
        fontWeight="900"
        fill={`url(#${grad2Id})`}
        letterSpacing="-0.5"
      >
        PIC
      </text>

      {/* Subtitle */}
      {showSubtitle && (
        <text
          x="86"
          y="66"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="10.5"
          fontWeight="700"
          fill={subtitleColor}
          letterSpacing="4.5"
        >
          PREMIUM PHOTOBOOKS
        </text>
      )}
    </svg>
  );
}

export default BrandLogo;
