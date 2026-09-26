import type { Config } from "tailwindcss";

const config: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        // Luxury Monochrome Base — Warm Cream Palette
        cream: {
          50: "#FAF8F5",   // Primary page canvas, backgrounds
          100: "#F4F0E8",  // Cards, panels, modals
          200: "#ECE5D8",  // Secondary surfaces, toolbar trays
          300: "#DFD7C7",  // Borders, dividers
          400: "#C8BEAC",  // Drag-drop zones, guidelines
          500: "#A89D8B",  // Placeholder text, inactive icons
        },
        // Rich Obsidian Noir Palette
        noir: {
          950: "#0A0A0A",  // Primary CTA buttons, brand wordmark
          900: "#141413",  // Primary typography, headings
          800: "#201F1D",  // Dark surfaces, floating bars
          700: "#3B3835",  // Secondary body copy, subtitles
          600: "#4D4944",  // Tertiary text
          500: "#66625C",  // Metadata, captions, page numbers
          400: "#8C867E",  // Disabled states
        },
        // Metallic Foil & Editorial Accents
        foil: {
          gold: "#C5A880",       // Gold embossing, active selection rings
          "gold-light": "#DFC9A8",
          silver: "#D3D7DC",
          rosegold: "#D4A396",
        },
        // Semantic Tokens
        luxury: {
          canvas: "#FAF8F5",
          surface: "#F4F0E8",
          "surface-elevated": "#FFFFFF",
          border: "#DFD7C7",
          "border-subtle": "rgba(223, 215, 199, 0.5)",
          primary: "#141413",
          muted: "#66625C",
          accent: "#C5A880",
        },
        // Status Colors
        status: {
          success: "#2D6A4F",
          warning: "#A34A3B",
          info: "#4A6FA5",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "serif"],
      },
      fontSize: {
        "fluid-hero": "clamp(2rem, 1.2rem + 3.5vw, 4.5rem)",
        "fluid-title": "clamp(1.5rem, 1rem + 2vw, 2.75rem)",
        "fluid-subtitle": "clamp(1.125rem, 0.95rem + 1vw, 1.75rem)",
        "fluid-body": "clamp(0.95rem, 0.9rem + 0.25vw, 1.125rem)",
      },
      spacing: {
        "fluid-gutter": "clamp(1rem, 0.5rem + 2vw, 3rem)",
      },
      boxShadow: {
        "luxury-sm":
          "0 1px 3px 0 rgba(20, 20, 19, 0.04), 0 1px 2px -1px rgba(20, 20, 19, 0.04)",
        "luxury-md":
          "0 4px 16px -2px rgba(20, 20, 19, 0.06), 0 2px 6px -2px rgba(20, 20, 19, 0.03)",
        "luxury-lg":
          "0 12px 32px -4px rgba(20, 20, 19, 0.08), 0 4px 12px -2px rgba(20, 20, 19, 0.04)",
        "luxury-xl":
          "0 24px 48px -8px rgba(20, 20, 19, 0.1), 0 8px 24px -4px rgba(20, 20, 19, 0.05)",
        "book-spread":
          "0 20px 40px -15px rgba(20, 20, 19, 0.12), 0 0 0 1px rgba(20, 20, 19, 0.05)",
        "gutter-shadow": "inset 0 0 25px rgba(0, 0, 0, 0.12)",
      },
      borderRadius: {
        luxury: "2px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.6s ease-out forwards",
        "slide-up": "slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
};

export default config;
