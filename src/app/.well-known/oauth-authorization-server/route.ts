import { NextResponse } from "next/server";
import { getOAuthMetadata } from "@/lib/mcp-oauth";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(getOAuthMetadata());
}
