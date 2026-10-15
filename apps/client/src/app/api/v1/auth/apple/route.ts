import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const redirect = url.searchParams.get("redirect") || "/";
  const backendBase =
    process.env.INTERNAL_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.perfectpic.in";

  const targetUrl = `${backendBase.replace(/\/+$/, "")}/api/v1/auth/apple?redirect=${encodeURIComponent(redirect)}`;
  return NextResponse.redirect(new URL(targetUrl));
}
