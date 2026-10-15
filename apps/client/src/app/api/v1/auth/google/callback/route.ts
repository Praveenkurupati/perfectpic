import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "/";
  const error = url.searchParams.get("error");

  // If user cancelled or Google returned an error
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/login?error=missing_authorization_code`, request.url)
    );
  }

  // Target Backend API candidate endpoints
  const backendCandidates = [
    process.env.INTERNAL_BACKEND_URL,
    process.env.BACKEND_URL,
    process.env.NEXT_PUBLIC_API_URL,
    "http://backend:4000",
    "http://127.0.0.1:4000",
    "https://api.perfectpic.in",
  ].filter(Boolean) as string[];

  // 1. Attempt server-to-server proxy exchange
  for (const backendBase of backendCandidates) {
    try {
      const cleanBase = backendBase.replace(/\/+$/, "");
      const targetUrl = `${cleanBase}/api/v1/auth/google/callback?${url.searchParams.toString()}`;

      const res = await fetch(targetUrl, {
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml,application/json,*/*",
          host: "perfectpic.in",
          "x-forwarded-host": "perfectpic.in",
          "x-forwarded-proto": "https",
        },
        redirect: "manual",
        cache: "no-store",
      });

      // Express returns 302 with Location header pointing to /login?oauth_token=...
      const location = res.headers.get("location");
      if (location) {
        const absoluteTarget = location.startsWith("http")
          ? location
          : new URL(location, request.url).toString();
        return NextResponse.redirect(new URL(absoluteTarget));
      }

      // If backend returned JSON with token directly
      if (res.ok) {
        const body = await res.json().catch(() => null);
        if (body?.token) {
          return NextResponse.redirect(
            new URL(
              `/login?oauth_token=${encodeURIComponent(body.token)}&redirect=${encodeURIComponent(state)}`,
              request.url
            )
          );
        }
      }
    } catch (err) {
      console.warn(`[OAuth Proxy] Failed connecting to backend at ${backendBase}:`, err);
    }
  }

  // 2. Fallback: Direct browser redirection to api.perfectpic.in
  const directFallback = `https://api.perfectpic.in/api/v1/auth/google/callback?${url.searchParams.toString()}`;
  return NextResponse.redirect(new URL(directFallback));
}
