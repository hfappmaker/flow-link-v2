export const runtime = "nodejs";

export function GET() {
  return Response.json(
    {
      error: "mcp_resource_removed",
      message: "The /api/mcp resource has been split by persona.",
      endpoints: {
        company: "/api/mcp/company",
        engineer: "/api/mcp/engineer",
      },
    },
    { status: 410 },
  );
}
