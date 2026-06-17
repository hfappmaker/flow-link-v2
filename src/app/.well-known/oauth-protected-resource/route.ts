import { NextResponse } from "next/server";
import { getProtectedResourceMetadata } from "@/lib/mcp-oauth";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(getProtectedResourceMetadata());
}
