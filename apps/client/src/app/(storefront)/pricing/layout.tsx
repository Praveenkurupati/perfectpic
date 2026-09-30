import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Photobook Pricing & Specifications — Transparent & Zero Hidden Fees",
  description:
    "Explore transparent pricing for PerfectPic custom photobooks starting from ₹1,999. Lay-flat binding, archival non-tearable paper, hardcover finish, and free delivery across India included.",
  alternates: {
    canonical: "https://perfectpic.in/pricing",
  },
  openGraph: {
    title: "Photobook Pricing & Specifications | PerfectPic",
    description:
      "Transparent pricing starting from ₹1,999. Free doorstep shipping across India, archival paper, and 100% reprint guarantee.",
    url: "https://perfectpic.in/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
