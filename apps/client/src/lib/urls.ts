/**
 * Helper to resolve dynamic URLs for Client Storefront.
 * Works seamlessly in both local development and production EC2/custom domain deployments.
 */

/**
 * Returns the Admin Portal URL.
 * 1. Uses NEXT_PUBLIC_ADMIN_URL if explicitly defined in environment.
 * 2. In browser, detects direct port access (e.g. localhost:3000 -> :3001/admin).
 * 3. In production reverse proxy (e.g. perfectpic.in), targets /admin on the current domain.
 * 4. Falls back to http://localhost:3001/admin during SSR or when hostname cannot be determined.
 */
export function getAdminPortalUrl(): string {
  if (process.env.NEXT_PUBLIC_ADMIN_URL) {
    return process.env.NEXT_PUBLIC_ADMIN_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;

    // Direct port access in local development or IP test
    if (port === '3000' || hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:3001/admin`;
    }

    // Reverse proxy production setup (e.g. https://perfectpic.in/admin)
    return `${protocol}//${hostname}/admin`;
  }
  return 'http://localhost:3001/admin';
}

/**
 * Returns the Backend API Base URL.
 * 1. Uses NEXT_PUBLIC_API_URL if explicitly defined in environment.
 * 2. In browser, targets port 4000 when running on direct port (localhost:3000) or domain root when proxied.
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
    if (port === '3000' || hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:4000`;
    }

    // Reverse proxy production setup (e.g. https://perfectpic.in)
    return `${protocol}//${hostname}`;
  }
  return 'http://localhost:4000';
}
