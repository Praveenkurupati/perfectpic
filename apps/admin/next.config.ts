import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  basePath: '/admin',
  transpilePackages: ['@repo/ui', '@repo/types'],
};

export default nextConfig;
