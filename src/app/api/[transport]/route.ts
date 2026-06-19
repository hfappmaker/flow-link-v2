import { legacyMcpRouteHandler } from "@/lib/flow-link-mcp-route";

export const runtime = "nodejs";
export const maxDuration = 60;

export { legacyMcpRouteHandler as GET, legacyMcpRouteHandler as POST };
