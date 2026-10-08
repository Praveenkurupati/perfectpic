"use client";

import React from "react";

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
  const isDark = variant === "dark";
  const textColor = isDark ? "#FFFFFF" : "#1F2937";
  const subtitleColor = isDark ? "#9CA3AF" : "#6B7280";

  if (iconOnly) {
    return (
      <svg
        viewBox="0 0 36 36"
        width={width || 36}
        height={height || 36}
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="PerfectPic Mark"
      >
        <rect width="36" height="36" rx="9" fill={isDark ? "#FFFFFF" : "#000000"} />
        <circle cx="18" cy="7" r="3" fill={isDark ? "#000000" : "#FFFFFF"} />
        <rect x="7" y="12.5" width="9.5" height="15" rx="1.8" fill={isDark ? "#000000" : "#FFFFFF"} />
        <rect x="19.5" y="12.5" width="9.5" height="15" rx="1.8" fill={isDark ? "#000000" : "#FFFFFF"} />
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
      {/* Brand Icon Mark: Open Photobook Squircle */}
      <g transform="translate(6, 12)">
        <rect width="52" height="52" rx="13" fill={isDark ? "#FFFFFF" : "#000000"} />
        <circle cx="26" cy="10.5" r="4.3" fill={isDark ? "#000000" : "#FFFFFF"} />
        <rect x="10" y="18.5" width="13.7" height="21.6" rx="2.6" fill={isDark ? "#000000" : "#FFFFFF"} />
        <rect x="28" y="18.5" width="13.7" height="21.6" rx="2.6" fill={isDark ? "#000000" : "#FFFFFF"} />
      </g>

      {/* Brand Typography */}
      <text
        x="74"
        y="47"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="33"
        fontWeight="900"
        fill={textColor}
        letterSpacing="-0.5"
      >
        PERFECT
      </text>
      <text
        x="220"
        y="47"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="33"
        fontWeight="900"
        fill={textColor}
        letterSpacing="-0.5"
      >
        PIC
      </text>

      {/* Subtitle */}
      {showSubtitle && (
        <text
          x="76"
          y="65"
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
