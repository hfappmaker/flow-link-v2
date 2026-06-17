import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getOAuthMetadata,
  getProtectedResourceMetadata,
  getWwwAuthenticateHeader,
  filterValidRedirectUris,
  isSameOAuthResource,
  isValidMcpResource,
  isValidRedirectUri,
  normalizeOAuthResource,
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
      assert.equal("revocation_endpoint" in authMetadata, false);
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

  it("uses the request origin when OAUTH_ISSUER is not configured", () => {
    const previousIssuer = process.env.OAUTH_ISSUER;
    const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.OAUTH_ISSUER;
    delete process.env.NEXT_PUBLIC_APP_URL;

    try {
      const request = new Request("https://flow-link-v2-git-develop-example.vercel.app/.well-known/oauth-protected-resource");
      const authMetadata = getOAuthMetadata(request);
      assert.equal(authMetadata.issuer, "https://flow-link-v2-git-develop-example.vercel.app");
      assert.equal(
        authMetadata.authorization_endpoint,
        "https://flow-link-v2-git-develop-example.vercel.app/oauth/authorize",
      );

      const resourceMetadata = getProtectedResourceMetadata(request);
      assert.equal(resourceMetadata.resource, "https://flow-link-v2-git-develop-example.vercel.app/api/mcp");
      assert.deepEqual(resourceMetadata.authorization_servers, ["https://flow-link-v2-git-develop-example.vercel.app"]);
    } finally {
      if (previousIssuer === undefined) delete process.env.OAUTH_ISSUER;
      else process.env.OAUTH_ISSUER = previousIssuer;
      if (previousAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
    }
  });

  it("falls back to the configured app URL for untrusted request origins", () => {
    const previousIssuer = process.env.OAUTH_ISSUER;
    const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.OAUTH_ISSUER;
    process.env.NEXT_PUBLIC_APP_URL = "https://flowlink.flowtech.co.jp";

    try {
      const request = new Request("https://attacker.example.test/.well-known/oauth-protected-resource");
      const authMetadata = getOAuthMetadata(request);
      assert.equal(authMetadata.issuer, "https://flowlink.flowtech.co.jp");

      const resourceMetadata = getProtectedResourceMetadata(request);
      assert.equal(resourceMetadata.resource, "https://flowlink.flowtech.co.jp/api/mcp");
    } finally {
      if (previousIssuer === undefined) delete process.env.OAUTH_ISSUER;
      else process.env.OAUTH_ISSUER = previousIssuer;
      if (previousAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
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

  it("validates MCP resource indicators for audience binding", () => {
    assert.equal(
      normalizeOAuthResource("HTTPS://FLOW-LINK-V2-GIT-DEVELOP-EXAMPLE.VERCEL.APP/api/mcp"),
      "https://flow-link-v2-git-develop-example.vercel.app/api/mcp",
    );
    assert.equal(isValidMcpResource("https://flow-link-v2-git-develop-example.vercel.app/api/mcp"), true);
    assert.equal(isValidMcpResource("https://flow-link-v2-git-develop-example.vercel.app/api/mcp#token"), false);
    assert.equal(isValidMcpResource("https://flow-link-v2-git-develop-example.vercel.app/api/other"), false);
    assert.equal(isSameOAuthResource("HTTPS://FLOW-LINK-V2-GIT-DEVELOP-EXAMPLE.VERCEL.APP/api/mcp", "https://flow-link-v2-git-develop-example.vercel.app/api/mcp"), true);
  });

  it("builds WWW-Authenticate challenges with MCP resource metadata and scope", () => {
    const request = new Request("https://flow-link-v2-git-develop-example.vercel.app/api/mcp");
    assert.equal(
      getWwwAuthenticateHeader(request, {
        error: "insufficient_scope",
        scope: "project:write",
        errorDescription: "Missing required scope: project:write",
      }),
      'Bearer error="insufficient_scope", scope="project:write", resource_metadata="https://flow-link-v2-git-develop-example.vercel.app/.well-known/oauth-protected-resource", error_description="Missing required scope: project:write"',
    );
  });

  it("validates OAuth redirect URI shape", () => {
    assert.equal(isValidRedirectUri("https://example.com/callback"), true);
    assert.equal(isValidRedirectUri("http://localhost:8787/callback"), true);
    assert.equal(isValidRedirectUri("http://127.0.0.1:8787/callback"), true);
    assert.equal(isValidRedirectUri("http://example.com/callback"), false);
    assert.equal(isValidRedirectUri("cursor://example.com/oauth/callback"), true);
    assert.equal(isValidRedirectUri("com.example.app:/oauth/callback"), true);
    assert.equal(isValidRedirectUri("javascript:alert(1)"), false);
    assert.equal(isValidRedirectUri("file:///tmp/callback"), false);
    assert.equal(isValidRedirectUri("https://example.com/callback#fragment"), false);
  });

  it("filters unsupported redirect URIs from dynamic registration input", () => {
    assert.deepEqual(
      filterValidRedirectUris([
        "cursor://anysphere.cursor-mcp/oauth/callback",
        "https://www.cursor.com/agents/mcp/oauth/callback",
        "http://localhost:8787/callback",
      ]),
      [
        "cursor://anysphere.cursor-mcp/oauth/callback",
        "https://www.cursor.com/agents/mcp/oauth/callback",
        "http://localhost:8787/callback",
      ],
    );
  });

  it("verifies S256 PKCE challenges", () => {
    const verifier = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~";
    const challenge = sha256Base64Url(verifier);

    assert.equal(verifyPkceS256(verifier, challenge), true);
    assert.equal(verifyPkceS256(`${verifier}x`, challenge), false);
  });
});
