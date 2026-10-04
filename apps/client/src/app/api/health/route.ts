import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "perfectpic-client",
    timestamp: new Date().toISOString(),
  });
}
