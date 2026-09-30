/**
 * Helper to resolve dynamic URLs for Admin Portal.
 * Works seamlessly in both local development and production EC2/custom domain deployments.
 */

/**
 * Returns the Storefront URL.
 * 1. Uses NEXT_PUBLIC_STOREFRONT_URL if explicitly defined in environment.
 * 2. In browser, detects direct port access (e.g. localhost:3001 -> :3000).
 * 3. In production reverse proxy (e.g. perfectpic.in), targets the root / on current domain.
 * 4. Falls back to http://localhost:3000 during SSR or when hostname cannot be determined.
 */
export function getStorefrontUrl(path: string = ''): string {
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  if (process.env.NEXT_PUBLIC_STOREFRONT_URL) {
    return `${process.env.NEXT_PUBLIC_STOREFRONT_URL.replace(/\/+$/, '')}${cleanPath}`;
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;

    // Direct port access in local development or IP test
    if (port === '3001' || hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:3000${cleanPath}`;
    }

    // Reverse proxy production setup (e.g. https://perfectpic.in/)
    return `${protocol}//${hostname}${cleanPath || '/'}`;
  }
  return `http://localhost:3000${cleanPath}`;
}

/**
 * Returns the Backend API Base URL.
 * 1. Uses NEXT_PUBLIC_API_URL if explicitly defined in environment.
 * 2. In browser, targets port 4000 when running on direct port (localhost:3001) or domain root when proxied.
 * 3. Falls back to http://localhost:4000 during SSR or when hostname cannot be determined.
 */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;

    // Direct port access in local development or IP test
    if (port === '3001' || hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:4000`;
    }

    // Reverse proxy production setup (e.g. https://perfectpic.in)
    return `${protocol}//${hostname}`;
  }
  return 'http://localhost:4000';
}
