import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/types", "@repo/database", "@repo/config-tailwind", "@repo/config-typescript"],
};

export default nextConfig;
