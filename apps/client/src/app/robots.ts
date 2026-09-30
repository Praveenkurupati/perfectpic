import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
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
    sitemap: "https://perfectpic.in/sitemap.xml",
    host: "https://perfectpic.in",
  };
}
