// apps/client/src/lib/metaPixel.ts
import { getApiBaseUrl } from './urls';

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

// Generate unique event ID for Meta Pixel + CAPI deduplication
export function generateEventId(prefix: string = 'ev'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

// Cookie helpers
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match && match[3] ? decodeURIComponent(match[3]) : undefined;
}

function setCookie(name: string, value: string, days: number = 90) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

// Capture fbclid URL parameter and store as _fbc cookie
export function initFacebookClickTracking() {
  if (typeof window === 'undefined') return;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');
    if (fbclid) {
      // Format: fb.1.<creation_time>.<fbclid>
      const fbc = `fb.1.${Date.now()}.${fbclid}`;
      setCookie('_fbc', fbc, 90);
    }
  } catch {
    // Ignore cookie/URL errors
  }
}

export function getMetaTrackingCookies(): { fbp?: string; fbc?: string } {
  return {
    fbp: getCookie('_fbp'),
    fbc: getCookie('_fbc'),
  };
}

/**
 * Initialize Meta Pixel script in the browser DOM
 */
export function initMetaPixel(pixelId?: string) {
  if (typeof window === 'undefined') return;

  const activePixelId = pixelId || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '1148291053648123'; // Default PerfectPic Pixel ID

  // Prevent multiple initializations
  if (window.fbq) return;

  initFacebookClickTracking();

  /* eslint-disable */
  (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    if (s && s.parentNode) {
      s.parentNode.insertBefore(t, s);
    } else {
      b.head.appendChild(t);
    }
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  if (window.fbq) {
    window.fbq('init', activePixelId);
  }
}

/**
 * Send an event through BOTH client-side Pixel and server-side Conversions API (CAPI)
 * with the exact same event_id for Meta deduplication.
 */
export function trackMetaDualEvent(
  eventName: string,
  customData: Record<string, any> = {},
  userData: Record<string, any> = {},
  existingEventId?: string
): string {
  const eventId = existingEventId || generateEventId(eventName.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const { fbp, fbc } = getMetaTrackingCookies();

  // 1. Client-Side Meta Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('track', eventName, customData, { eventID: eventId });
    } catch {
      // silent
    }
  }

  // 2. Server-Side Conversions API Relay
  if (typeof window !== 'undefined') {
    const payload = {
      eventName,
      eventId,
      eventSourceUrl: window.location.href,
      userData: {
        ...userData,
        fbp,
        fbc,
      },
      customData: {
        currency: 'INR',
        ...customData,
      },
    };

    fetch(`${getApiBaseUrl()}/api/v1/analytics/meta-capi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // silent
    });
  }

  return eventId;
}

/**
 * Standard E-Commerce Tracking Helpers
 */

export function trackMetaPageView() {
  trackMetaDualEvent('PageView');
}

export function trackMetaViewContent(product: {
  id: string;
  title: string;
  price?: number;
  category?: string;
}) {
  trackMetaDualEvent('ViewContent', {
    content_name: product.title,
    content_category: product.category || 'Photobooks',
    content_ids: [product.id],
    value: product.price || 1999,
    currency: 'INR',
  });
}

export function trackMetaAddToCart(item: {
  id: string;
  title: string;
  price: number;
  quantity?: number;
}) {
  trackMetaDualEvent('AddToCart', {
    content_name: item.title,
    content_ids: [item.id],
    value: item.price * (item.quantity || 1),
    currency: 'INR',
    num_items: item.quantity || 1,
  });
}

export function trackMetaInitiateCheckout(cart: {
  subtotal: number;
  itemCount: number;
  items?: Array<{ id: string; title: string; price: number; quantity?: number }>;
}) {
  trackMetaDualEvent('InitiateCheckout', {
    value: cart.subtotal,
    currency: 'INR',
    num_items: cart.itemCount,
    content_ids: cart.items?.map((i) => i.id) || ['photobook'],
  });
}

export function trackMetaPurchase(order: {
  orderId: string;
  total: number;
  items?: any[];
  email?: string;
  phone?: string;
}) {
  trackMetaDualEvent(
    'Purchase',
    {
      value: order.total,
      currency: 'INR',
      order_id: order.orderId,
      num_items: order.items?.length || 1,
    },
    {
      email: order.email,
      phone: order.phone,
    },
    `order_${order.orderId}`
  );
}
