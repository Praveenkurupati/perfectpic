import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PerfectPic — Premium Photobooks & Albums",
    short_name: "PerfectPic",
    description:
      "Design exquisite lay-flat photobooks with archival non-tearable paper and HD color fidelity. Auto-layout in 60s, delivered across India.",
    start_url: "/",
    display: "standalone",
    background_color: "#FCFBF7",
    theme_color: "#0F172A",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    shortcuts: [
      {
        name: "Create Photobook",
        url: "/configure",
        description: "Configure and start building your custom lay-flat photobook",
      },
      {
        name: "Browse Templates",
        url: "/templates",
        description: "Explore curated travel, wedding, and memory photobook designs",
      },
    ],
  };
}
