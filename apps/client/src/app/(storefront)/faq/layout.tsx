import type { Metadata } from "next";
import { FaqJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — Photobook Printing, Paper & Delivery",
  description:
    "Got questions about PerfectPic? Learn about our non-tearable archival paper, seamless 180° lay-flat binding, production timelines, all-India shipping, and reprint guarantee.",
  alternates: {
    canonical: "https://perfectpic.in/faq",
  },
  openGraph: {
    title: "Frequently Asked Questions | PerfectPic",
    description:
      "Everything you need to know about archival lay-flat photo books, photo safety, shipping timelines, and quality guarantees.",
    url: "https://perfectpic.in/faq",
  },
};

const FAQ_ITEMS = [
  {
    q: "How long does it take to create a book?",
    a: "With our AI auto-layout, you can create a book in under 60 seconds. Simply select your photos, choose a theme, and we'll handle the rest. You can then review and make manual adjustments if you wish.",
  },
  {
    q: "Do I need an app to create a book?",
    a: "No! PerfectPic works entirely in your web browser at perfectpic.in. You can create, edit, and order directly from your smartphone, tablet, or desktop.",
  },
  {
    q: "What does 'non-tearable' mean?",
    a: "We use a premium synthetic paper that is virtually impossible to tear by hand. It's also water-resistant, making it perfect for families with young children.",
  },
  {
    q: "What is Lay-flat binding?",
    a: "Lay-flat binding allows your photo book to open completely flat, with no gutter in the middle. This means a single photo can stretch seamlessly across two pages without losing any detail in the crease.",
  },
  {
    q: "How long does shipping take?",
    a: "Orders are printed and shipped within 3-5 business days. Delivery typically takes an additional 2-4 days depending on your location in India.",
  },
  {
    q: "Do you charge for shipping?",
    a: "No, we offer free standard shipping across India on all our photo books.",
  },
];

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FaqJsonLd items={FAQ_ITEMS} />
      {children}
    </>
  );
}
