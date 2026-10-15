import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const backendBase =
      process.env.INTERNAL_BACKEND_URL ||
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://api.perfectpic.in";

    const cleanBase = backendBase.replace(/\/+$/, "");
    const targetUrl = `${cleanBase}/api/v1/auth/apple/callback`;

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "x-forwarded-host": "perfectpic.in",
        "x-forwarded-proto": "https",
      },
      body: formData,
      redirect: "manual",
    });

    const location = res.headers.get("location");
    if (location) {
      const absoluteTarget = location.startsWith("http")
        ? location
        : new URL(location, request.url).toString();
      return NextResponse.redirect(new URL(absoluteTarget));
    }

    return NextResponse.redirect(new URL("/login", request.url));
  } catch (err: any) {
    console.error("[Apple Callback Proxy Error]:", err);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(err.message || "Apple OAuth failed")}`, request.url));
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const directFallback = `https://api.perfectpic.in/api/v1/auth/apple/callback?${url.searchParams.toString()}`;
  return NextResponse.redirect(new URL(directFallback));
}
