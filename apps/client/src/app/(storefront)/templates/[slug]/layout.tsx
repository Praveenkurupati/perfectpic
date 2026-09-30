import type { Metadata } from "next";

const TEMPLATE_TITLES: Record<string, string> = {
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
    TEMPLATE_TITLES[slug] ||
    slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()) + " Photobook";

  return {
    title: `${name} — Premium Lay-Flat Photobook`,
    description: `Personalize the ${name} with your photos. Printed on archival non-tearable paper with seamless 180° lay-flat binding, delivered across India.`,
    alternates: {
      canonical: `https://perfectpic.in/templates/${slug}`,
    },
    openGraph: {
      title: `${name} | PerfectPic`,
      description: `Customize your ${name} on archival paper with lay-flat binding. Fast printing, all-India delivery.`,
      url: `https://perfectpic.in/templates/${slug}`,
    },
  };
}

export default function TemplateSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
