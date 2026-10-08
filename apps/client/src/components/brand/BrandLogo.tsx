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

  const viewBox = "0 0 250 64";
  const defaultHeight = 36;

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

      {/* Brand Typography: Lowercase Inter */}
      <text
        x="70"
        y="48"
        fontFamily="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="34"
        fontWeight="800"
        fill={textColor}
        letterSpacing="-0.04em"
      >
        perfectpic
      </text>
    </svg>
  );
}

export default BrandLogo;
