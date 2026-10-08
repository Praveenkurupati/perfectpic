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

/**
 * Returns a proxy URL for an external or non-CORS image to prevent canvas tainting or mixed-content blocking.
 */
export function getImageProxyUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  return `${getApiBaseUrl()}/api/v1/upload/proxy?url=${encodeURIComponent(rawUrl)}`;
}

/**
 * Normalizes an image URL for display:
 * 1. Preserves data: and blob: URLs
 * 2. Replaces localhost:4000 or relative /uploads/ with active API base URL
 * 3. Rewrites http:// to https:// or routes through proxy when on https:// page to avoid mixed-content blocks
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Data URLs or active Blob URLs
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const apiBase = getApiBaseUrl();

  // If URL contains /uploads/ pointing to localhost:4000 or 127.0.0.1:4000
  if (trimmed.includes('/uploads/')) {
    const relativePath = trimmed.substring(trimmed.indexOf('/uploads/'));
    return `${apiBase}${relativePath}`;
  }

  // If relative path
  if (trimmed.startsWith('/')) {
    return `${apiBase}${trimmed}`;
  }

  // Handle mixed-content: if browser is on HTTPS and image is HTTP
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    trimmed.startsWith('http://') &&
    !trimmed.includes('localhost') &&
    !trimmed.includes('127.0.0.1')
  ) {
    // If it's a known service supporting HTTPS (Unsplash, Google, AWS S3, CloudFront CDN), upgrade protocol directly
    if (
      trimmed.includes('unsplash.com') ||
      trimmed.includes('googleusercontent.com') ||
      trimmed.includes('amazonaws.com') ||
      trimmed.includes('cloudfront.net')
    ) {
      return trimmed.replace('http://', 'https://');
    }
    // Otherwise route through backend proxy
    return getImageProxyUrl(trimmed);
  }

  return trimmed;
}

/**
 * Universal error handler for <img> elements.
 * Automatically falls back to backend image proxy if direct access
 * (e.g. direct AWS S3 with private bucket or CORS restriction) returns 403/404/CORS block.
 * Uses dataset.retried to guard against infinite retry loops.
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl?: string
): void {
  const target = e.currentTarget;
  if (!target || target.dataset.retried === 'true') {
    return;
  }
  target.dataset.retried = 'true';

  const currentSrc = target.currentSrc || target.src;
  if (fallbackUrl) {
    target.src = fallbackUrl;
    return;
  }

  if (currentSrc && !currentSrc.startsWith('data:') && !currentSrc.startsWith('blob:')) {
    if (!currentSrc.includes('/api/v1/upload/proxy')) {
      target.src = getImageProxyUrl(currentSrc);
    }
  }
}
