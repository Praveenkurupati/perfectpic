import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customise Your Photobook — Sizes, Covers, Themes & Lay-Flat Pages",
  description:
    "Configure your custom lay-flat photobook. Select standard 8.25x11\" or square 10x10\" sizes, hardcover or leather bindings, curated color palettes, and archival non-tearable paper.",
  alternates: {
    canonical: "https://perfectpic.in/configure",
  },
  openGraph: {
    title: "Customise Your Photobook | PerfectPic",
    description:
      "Configure your custom lay-flat photobook. Select sizes, hardcover bindings, and archival non-tearable paper. Transparent pricing with free doorstep shipping across India.",
    url: "https://perfectpic.in/configure",
  },
};

export default function ConfigureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
