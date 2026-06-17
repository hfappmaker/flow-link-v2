import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getOAuthMetadata,
  getProtectedResourceMetadata,
  isValidRedirectUri,
  normalizeScopes,
  sha256Base64Url,
  verifyPkceS256,
} from "../src/lib/mcp-oauth";

describe("MCP OAuth helpers", () => {
  it("builds authorization server and protected resource metadata", () => {
    const previousIssuer = process.env.OAUTH_ISSUER;
    process.env.OAUTH_ISSUER = "https://flowlink.flowtech.co.jp/";

    try {
      const authMetadata = getOAuthMetadata();
      assert.equal(authMetadata.issuer, "https://flowlink.flowtech.co.jp");
      assert.equal(authMetadata.authorization_endpoint, "https://flowlink.flowtech.co.jp/oauth/authorize");
      assert.deepEqual(authMetadata.scopes_supported, [
        "company_profile:read",
        "company_profile:write",
        "engineer_profile:read",
        "engineer_profile:write",
        "project:read",
        "project:write",
      ]);
      assert.deepEqual(authMetadata.code_challenge_methods_supported, ["S256"]);

      const resourceMetadata = getProtectedResourceMetadata();
      assert.equal(resourceMetadata.resource, "https://flowlink.flowtech.co.jp/api/mcp");
      assert.deepEqual(resourceMetadata.authorization_servers, ["https://flowlink.flowtech.co.jp"]);
    } finally {
      if (previousIssuer === undefined) delete process.env.OAUTH_ISSUER;
      else process.env.OAUTH_ISSUER = previousIssuer;
    }
  });

  it("normalizes only supported scopes", () => {
    assert.deepEqual(normalizeScopes("project:read project:write project:read"), [
      "project:read",
      "project:write",
    ]);
    assert.deepEqual(normalizeScopes(undefined), ["project:read"]);
    assert.deepEqual(normalizeScopes("company_profile:read company_profile:write"), [
      "company_profile:read",
      "company_profile:write",
    ]);
    assert.deepEqual(normalizeScopes("engineer_profile:read engineer_profile:write"), [
      "engineer_profile:read",
      "engineer_profile:write",
    ]);
    assert.equal(normalizeScopes("project:publish"), null);
    assert.equal(normalizeScopes("project:edit"), null);
    assert.equal(normalizeScopes("profile:read"), null);
  });

  it("validates OAuth redirect URI shape", () => {
    assert.equal(isValidRedirectUri("https://example.com/callback"), true);
    assert.equal(isValidRedirectUri("http://localhost:8787/callback"), true);
    assert.equal(isValidRedirectUri("http://127.0.0.1:8787/callback"), true);
    assert.equal(isValidRedirectUri("http://example.com/callback"), false);
    assert.equal(isValidRedirectUri("https://example.com/callback#fragment"), false);
  });

  it("verifies S256 PKCE challenges", () => {
    const verifier = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~";
    const challenge = sha256Base64Url(verifier);

    assert.equal(verifyPkceS256(verifier, challenge), true);
    assert.equal(verifyPkceS256(`${verifier}x`, challenge), false);
  });
});
