import type { Metadata } from "next";

const BOOK_TITLES: Record<string, string> = {
  "sri-lanka-travel": "Sri Lanka Travel Diary Photobook",
  "colombia-adventure": "Colombia Adventure Photobook",
  "annapurna-base-camp": "Annapurna Base Camp Trek Photobook",
  "first-anniversary": "Our 1st Anniversary Keepsake Photobook",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name =
    BOOK_TITLES[slug] ||
    slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()) + " Photobook";

  return {
    title: `${name} — Premium Lay-Flat Photobook`,
    description: `Order the ${name} custom photobook. Archival non-tearable paper, seamless 180° lay-flat binding, and doorstep delivery across India.`,
    alternates: {
      canonical: `https://perfectpic.in/book/${slug}`,
    },
    openGraph: {
      title: `${name} | PerfectPic`,
      description: `Order your ${name} custom photobook on perfectpic.in.`,
      url: `https://perfectpic.in/book/${slug}`,
    },
  };
}

export default function BookSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
