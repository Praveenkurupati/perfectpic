import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, Cinzel } from "next/font/google";
import "./globals.css";
import { AnimationProvider } from "@/components/providers/AnimationProvider";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Whitebook — Premium Photo Books",
  description: "Create premium handcrafted photobooks that last generations. Printed on non-tearable, spill-safe pages with lay-flat binding.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${plusJakarta.variable} ${cinzel.variable}`}>
      <body className="bg-cream-50 text-noir-900 font-sans antialiased">
        <AnimationProvider>
          {children}
        </AnimationProvider>
      </body>
    </html>
  );
}
