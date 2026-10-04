import type { MetadataRoute } from "next";

export const ALL_TEMPLATE_SLUGS = [
  "trek-series-nethravathi",
  "travel-series-kerala",
  "trek-series-himalaya",
  "travel-series-varkala",
  "trek-series-kudremukh",
  "trek-series-annapurna",
  "travel-series-munnar",
  "travel-series-ladakh",
  "trek-series-kedarkantha",
  "travel-series-rajasthan",
  "trek-series-valley-of-flowers",
  "travel-series-goa",
  "travel-series-varanasi",
  "trek-series-chadar",
  "trek-series-hampta-pass",
  "travel-series-rishikesh",
  "travel-series-hampi",
  "trek-series-roopkund",
  "travel-series-spiti",
  "trek-series-sandakphu",
  "travel-series-meghalaya",
  "travel-series-andaman",
  "first-anniversary",
  "travel-series-paris",
  "travel-series-kyoto",
  "travel-series-italy",
  "travel-series-london",
  "travel-series-greece",
  "travel-series-newyork",
  "travel-series-bali",
  "travel-series-japan",
  "travel-series-rome",
  "travel-series-europe",
  "moments-series-summer",
  "travel-edit-paris",
  "sri-lanka-travel",
  "colombia-adventure",
  "annapurna-base-camp",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://perfectpic.in";
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
      priority: 0.95,
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
      priority: 0.85,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Specific template showcase pages & book views
  const templateRoutes: MetadataRoute.Sitemap = ALL_TEMPLATE_SLUGS.flatMap((slug) => [
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
      priority: 0.8,
    },
  ]);

  // Category landing configurations
  const categorySlugs = [
    "travel",
    "trek",
    "wedding",
    "baby-first-year",
    "birthday",
    "anniversary",
    "festivals",
    "moments",
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categorySlugs.flatMap((cat) => [
    {
      url: `${baseUrl}/templates?category=${cat}`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/configure?category=${cat}`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    },
  ]);

  return [...coreRoutes, ...templateRoutes, ...categoryRoutes];
}
