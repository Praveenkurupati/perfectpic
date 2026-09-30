import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Designer Photobook Templates — Travel, Wedding, Baby & Milestones",
  description:
    "Explore curated designer templates for your custom photobook. From Himalayan trek diaries to romantic wedding albums and baby memory books, start building on perfectpic.in.",
  alternates: {
    canonical: "https://perfectpic.in/templates",
  },
  openGraph: {
    title: "Designer Photobook Templates | PerfectPic",
    description:
      "Explore curated designer templates for your custom photobook. Seamless lay-flat spreads, archival non-tearable paper, and vivid HD color.",
    url: "https://perfectpic.in/templates",
  },
};

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
