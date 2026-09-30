/**
 * Helper to resolve dynamic URLs for Client Storefront.
 * Works seamlessly in both local development and production EC2/custom domain deployments.
 */

/**
 * Returns the Admin Portal URL.
 * 1. Uses NEXT_PUBLIC_ADMIN_URL if explicitly defined in environment.
 * 2. In browser, dynamically falls back to the current window's protocol and hostname on port 3001.
 * 3. Falls back to http://localhost:3001 during SSR or when hostname cannot be determined.
 */
export function getAdminPortalUrl(): string {
  if (process.env.NEXT_PUBLIC_ADMIN_URL) {
    return process.env.NEXT_PUBLIC_ADMIN_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:3001`;
  }
  return 'http://localhost:3001';
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
