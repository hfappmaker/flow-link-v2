import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { POST } from "../src/app/oauth/token/route";

describe("OAuth token endpoint", () => {
  it("treats missing refresh tokens as an invalid grant", async () => {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: "cursor-client",
      resource: "https://flowlink.flowtech.co.jp/api/mcp",
    });
    const response = await POST(
      new Request("https://flowlink.flowtech.co.jp/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      }),
    );

    assert.equal(response.status, 400);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(response.headers.get("Pragma"), "no-cache");
    assert.deepEqual(await response.json(), {
      error: "invalid_grant",
      error_description: "Refresh token is missing or invalid. Reauthorization is required.",
    });
  });

  it("rejects invalid refresh token resource values when provided", async () => {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: "cursor-client",
      refresh_token: "stored-refresh-token",
      resource: "https://flowlink.flowtech.co.jp/api/other",
    });
    const response = await POST(
      new Request("https://flowlink.flowtech.co.jp/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      }),
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: "invalid_target",
      error_description: "Unsupported resource.",
    });
  });
});
