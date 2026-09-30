import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://perfectpic.in";
  const currentDate = new Date();

  // Core high-value marketing & storefront pages
  const coreRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/templates`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/configure`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Specific template showcase pages
  const templateSlugs = [
    "sri-lanka-travel",
    "colombia-adventure",
    "annapurna-base-camp",
    "first-anniversary",
  ];

  const templateRoutes: MetadataRoute.Sitemap = templateSlugs.flatMap((slug) => [
    {
      url: `${baseUrl}/templates/${slug}`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/book/${slug}`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    },
  ]);

  // Category landing configurations
  const categorySlugs = [
    "travel",
    "wedding",
    "baby-first-year",
    "birthday",
    "anniversary",
    "festivals",
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categorySlugs.map((cat) => ({
    url: `${baseUrl}/configure?category=${cat}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return [...coreRoutes, ...templateRoutes, ...categoryRoutes];
}
