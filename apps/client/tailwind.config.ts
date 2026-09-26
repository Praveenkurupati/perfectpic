import type { Config } from "tailwindcss";
import sharedConfig from "@repo/config-tailwind";

const config: Config = {
  presets: [sharedConfig],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FAF8F5',
          100: '#F4F0E8',
          300: '#DFD7C7',
        },
        noir: {
          700: '#3B3835',
          900: '#141413',
          950: '#0A0A0A',
        },
        foil: {
          gold: '#C5A880',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
      },
      boxShadow: {
        'luxury-sm': '0 2px 4px rgba(20, 20, 19, 0.05)',
        'luxury-md': '0 4px 12px rgba(20, 20, 19, 0.08)',
        'luxury-lg': '0 12px 24px rgba(20, 20, 19, 0.12)',
        'luxury-xl': '0 24px 48px rgba(20, 20, 19, 0.16)',
        'book-spread': '0 20px 40px -10px rgba(0,0,0,0.2), inset 0 0 40px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        DEFAULT: '2px',
      }
    },
  },
  plugins: [],
};

export default config;
