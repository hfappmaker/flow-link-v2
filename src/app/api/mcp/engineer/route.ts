import { createFlowLinkMcpRouteHandler } from "@/lib/flow-link-mcp-route";

export const runtime = "nodejs";
export const maxDuration = 60;

const routeHandler = createFlowLinkMcpRouteHandler("engineer");

export { routeHandler as GET, routeHandler as POST };
