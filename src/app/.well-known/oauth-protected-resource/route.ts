import { NextResponse } from "next/server";
import { getProtectedResourceMetadata } from "@/lib/mcp-oauth";

export const runtime = "nodejs";

export function GET(request: Request) {
  return NextResponse.json(getProtectedResourceMetadata(request));
}
