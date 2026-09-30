// apps/client/src/lib/analytics.ts
import { getApiBaseUrl } from './urls';

export interface TrackingEvent {
  eventType: 'pageview' | 'config_change' | 'photo_upload' | 'editor_action' | 'cart_action' | 'checkout_step' | 'order_completed' | 'auth_action';
  eventName: string;
  path?: string;
  metadata?: Record<string, any>;
}

// Generate secure random ID
function generateId(prefix: string): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${rand}${time}`;
}

// Get or create persistent Anonymous Visitor ID
export function getAnonymousId(): string {
  if (typeof window === 'undefined') return 'anon_server';
  try {
    let anonId = localStorage.getItem('pp_anon_id');
    if (!anonId) {
      anonId = generateId('anon');
      localStorage.setItem('pp_anon_id', anonId);
    }
    return anonId;
  } catch {
    return 'anon_ephemeral';
  }
}

// Get or create Session ID (rotates after 30 mins inactivity)
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'sess_server';
  try {
    const SESSION_TIMEOUT = 30 * 60 * 1000;
    const now = Date.now();
    const lastActive = parseInt(sessionStorage.getItem('pp_last_active') || '0', 10);
    let sessId = sessionStorage.getItem('pp_session_id');

    if (!sessId || (lastActive && now - lastActive > SESSION_TIMEOUT)) {
      sessId = generateId('sess');
      sessionStorage.setItem('pp_session_id', sessId);
    }

    sessionStorage.setItem('pp_last_active', now.toString());
    return sessId;
  } catch {
    return 'sess_ephemeral';
  }
}

// Device & screen detection
function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

// Traffic source detection
function getTrafficSource(): string {
  if (typeof window === 'undefined') return 'direct';
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    if (utmSource) return utmSource.toLowerCase();

    const ref = document.referrer;
    if (!ref) return 'direct';
    if (ref.includes('google')) return 'organic';
    if (ref.includes('instagram') || ref.includes('facebook') || ref.includes('t.co')) return 'social';
    if (ref.includes('mail') || ref.includes('outlook')) return 'email';
    return 'referral';
  } catch {
    return 'direct';
  }
}

// Check logged in status and user details
function getAuthContext(): { isLoggedIn: boolean; userId?: string } {
  if (typeof window === 'undefined') return { isLoggedIn: false };
  try {
    const token = localStorage.getItem('pp_token');
    const userStr = localStorage.getItem('pp_user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      return { isLoggedIn: true, userId: user.id || user._id };
    }
  } catch {
    // fallback
  }
  return { isLoggedIn: false };
}

/**
 * Send event to backend using sendBeacon or keepalive fetch
 */
export function trackEvent(
  eventType: TrackingEvent['eventType'],
  eventName: string,
  metadata?: Record<string, any>
) {
  if (typeof window === 'undefined') return;

  try {
    const anonId = getAnonymousId();
    const sessId = getSessionId();
    const device = getDeviceType();
    const source = getTrafficSource();
    const { isLoggedIn, userId } = getAuthContext();

    const payload = {
      anonymousId: anonId,
      sessionId: sessId,
      userId,
      isLoggedIn,
      eventType,
      eventName,
      path: window.location.pathname,
      referrer: document.referrer || '',
      device,
      source,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    };

    const endpoint = `${getApiBaseUrl()}/api/v1/analytics/events`;
    const dataString = JSON.stringify({ events: [payload] });

    if (navigator.sendBeacon) {
      const blob = new Blob([dataString], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: dataString,
        keepalive: true,
      }).catch(() => {
        // silent fail to avoid disturbing user
      });
    }
  } catch {
    // silent fail
  }
}

/**
 * Track route / page navigation
 */
export function trackPageView(path: string, title?: string) {
  trackEvent('pageview', `Page View: ${title || path}`, { path });
}
