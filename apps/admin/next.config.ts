import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: "/admin",
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@repo/ui", "@repo/types"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Verification is handled in pre-commit/CI typecheck; skips duplicate 10-minute TS check during build
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "jspdf",
      "clsx",
      "tailwind-merge",
    ],
  },
};

export default nextConfig;
