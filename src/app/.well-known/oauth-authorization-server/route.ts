import { NextResponse } from "next/server";
import { getOAuthMetadata } from "@/lib/mcp-oauth";

export const runtime = "nodejs";

export function GET(request: Request) {
  return NextResponse.json(getOAuthMetadata(request));
}
