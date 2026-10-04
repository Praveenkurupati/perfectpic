import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://perfectpic.in";

  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/templates",
        "/templates/*",
        "/configure",
        "/pricing",
        "/faq",
        "/book/*",
        "/logo.svg",
        "/favicon.svg",
        "/og-image.png",
      ],
      disallow: [
        "/admin",
        "/admin/*",
        "/studio",
        "/studio/*",
        "/checkout",
        "/checkout/*",
        "/orders",
        "/orders/*",
        "/projects",
        "/projects/*",
        "/addresses",
        "/addresses/*",
        "/settings",
        "/settings/*",
        "/api",
        "/api/*",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
