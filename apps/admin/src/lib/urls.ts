/**
 * Helper to resolve dynamic URLs for Admin Portal.
 * Works seamlessly in both local development and production EC2/custom domain deployments.
 */

/**
 * Returns the Storefront URL.
 * 1. Uses NEXT_PUBLIC_STOREFRONT_URL if explicitly defined in environment.
 * 2. In browser, dynamically falls back to the current window's protocol and hostname on port 3000.
 * 3. Falls back to http://localhost:3000 during SSR or when hostname cannot be determined.
 */
export function getStorefrontUrl(path: string = ''): string {
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  if (process.env.NEXT_PUBLIC_STOREFRONT_URL) {
    return `${process.env.NEXT_PUBLIC_STOREFRONT_URL.replace(/\/+$/, '')}${cleanPath}`;
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:3000${cleanPath}`;
  }
  return `http://localhost:3000${cleanPath}`;
}

/**
 * Returns the Backend API Base URL.
 * 1. Uses NEXT_PUBLIC_API_URL if explicitly defined in environment.
 * 2. In browser, dynamically falls back to the current window's protocol and hostname on port 4000.
 * 3. Falls back to http://localhost:4000 during SSR or when hostname cannot be determined.
 */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:4000`;
  }
  return 'http://localhost:4000';
}
