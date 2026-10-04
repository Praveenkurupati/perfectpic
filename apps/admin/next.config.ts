import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: "/admin",
  transpilePackages: ["@repo/ui", "@repo/types"],
};

export default nextConfig;
