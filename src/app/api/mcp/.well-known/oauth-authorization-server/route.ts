export const runtime = "nodejs";

export function GET() {
  return Response.json(
    {
      error: "mcp_endpoint_removed",
      message: "The /api/mcp endpoint has been split by persona. Use the root authorization metadata endpoint.",
      authorizationServerMetadataUrl: "/.well-known/oauth-authorization-server",
      endpoints: {
        company: "/api/mcp/company",
        engineer: "/api/mcp/engineer",
      },
    },
    { status: 410 },
  );
}
