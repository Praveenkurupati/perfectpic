import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, Cinzel } from "next/font/google";
import "./globals.css";
import { AnimationProvider } from "@/components/providers/AnimationProvider";
import { AnalyticsTracker } from "@/components/providers/AnalyticsTracker";
import {
  OrganizationJsonLd,
  WebSiteJsonLd,
  PhotobookProductJsonLd,
} from "@/components/seo/JsonLd";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://perfectpic.in"),
  title: {
    default: "PerfectPic — Premium Custom Photo Books & Lay-Flat Albums",
    template: "%s | PerfectPic",
  },
  description:
    "Design exquisite lay-flat photobooks and keepsake albums online with PerfectPic. Featuring archival non-tearable paper, HD color fidelity, and nationwide doorstep delivery across India.",
  applicationName: "PerfectPic",
  authors: [{ name: "PerfectPic", url: "https://perfectpic.in" }],
  generator: "Next.js",
  keywords: [
    "photobooks India",
    "custom photo album",
    "lay-flat photobook",
    "wedding album printing",
    "travel photo book",
    "baby memory book",
    "birthday photo album",
    "premium photo album",
    "print photobooks online",
    "archival photo book",
    "non-tearable photobook",
    "custom photobook maker",
    "PerfectPic",
  ],
  referrer: "origin-when-cross-origin",
  creator: "PerfectPic",
  publisher: "PerfectPic",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://perfectpic.in",
  },
  openGraph: {
    title: "PerfectPic — Premium Custom Photo Books & Lay-Flat Albums",
    description:
      "Design exquisite lay-flat photobooks with archival non-tearable paper and HD color fidelity. Auto-curate in 60s, printed and delivered across India.",
    url: "https://perfectpic.in",
    siteName: "PerfectPic",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PerfectPic — Premium Photo Books That Last Generations",
    description:
      "Exquisite lay-flat photobooks and albums. Archival non-tearable paper, HD printing, and doorstep delivery across India.",
    creator: "@perfectpic_in",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
};

import { DpdpConsentBanner } from "@/components/common/DpdpConsentBanner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${plusJakarta.variable} ${cinzel.variable}`}>
      <head>
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <PhotobookProductJsonLd />
      </head>
      <body className="bg-cream-50 text-noir-900 font-sans antialiased">
        <AnalyticsTracker />
        <AnimationProvider>
          {children}
        </AnimationProvider>
        <DpdpConsentBanner />
        {/* Google Identity Services & Google Picker API SDKs */}
        <script src="https://accounts.google.com/gsi/client" async defer />
        <script src="https://apis.google.com/js/api.js" async defer />
      </body>
    </html>
  );
}
