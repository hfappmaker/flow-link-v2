import crypto from "node:crypto";
import { getAppUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";

export const OAUTH_SCOPES = [
  "company_profile:read",
  "company_profile:write",
  "engineer_profile:read",
  "engineer_profile:write",
  "project:read",
  "project:write",
] as const;
export type OAuthScope = (typeof OAUTH_SCOPES)[number];

export const AUTHORIZATION_CODE_TTL_SECONDS = 5 * 60;
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

export type McpAuthInfo = {
  clientId: string;
  userId: string;
  companyId: string | null;
  scopes: OAuthScope[];
};

export function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getOAuthIssuer() {
  return stripTrailingSlash(process.env.OAUTH_ISSUER ?? getAppUrl());
}

export function getMcpResourceUrl() {
  return `${getOAuthIssuer()}/api/mcp`;
}

export function getOAuthMetadata() {
  const issuer = getOAuthIssuer();
  return {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    registration_endpoint: `${issuer}/oauth/register`,
    revocation_endpoint: `${issuer}/oauth/revoke`,
    scopes_supported: OAUTH_SCOPES,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
  };
}

export function getProtectedResourceMetadata() {
  const issuer = getOAuthIssuer();
  return {
    resource: getMcpResourceUrl(),
    authorization_servers: [issuer],
    scopes_supported: OAUTH_SCOPES,
    bearer_methods_supported: ["header"],
  };
}

export function getWwwAuthenticateHeader() {
  return `Bearer resource_metadata="${getOAuthIssuer()}/.well-known/oauth-protected-resource"`;
}

export function secondsFromNow(seconds: number) {
  return new Date(Date.now() + seconds * 1000);
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function sha256Base64Url(value: string) {
  return crypto.createHash("sha256").update(value).digest("base64url");
}

export function verifyPkceS256(codeVerifier: string, codeChallenge: string) {
  if (!codeVerifier || !codeChallenge) return false;
  return timingSafeEqual(sha256Base64Url(codeVerifier), codeChallenge);
}

function timingSafeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function normalizeScopes(scope: string | undefined | null, fallback: OAuthScope[] = ["project:read"]) {
  const rawScopes = (scope ?? "")
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
  const requested = rawScopes.length ? rawScopes : fallback;
  const unique = [...new Set(requested)];

  if (unique.some((value) => !OAUTH_SCOPES.includes(value as OAuthScope))) {
    return null;
  }

  return unique as OAuthScope[];
}

export function scopeString(scopes: OAuthScope[]) {
  return [...new Set(scopes)].join(" ");
}

export function hasScope(scopes: OAuthScope[], required: OAuthScope) {
  return scopes.includes(required);
}

export function isValidRedirectUri(value: string) {
  try {
    const url = new URL(value);
    if (url.hash) return false;
    if (url.protocol === "https:") return true;
    if (url.protocol !== "http:") return false;
    return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}

export async function getBearerAuthInfo(request: Request) {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const tokenHash = hashToken(match[1].trim());
  const accessToken = await prisma.oAuthAccessToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      clientId: true,
      userId: true,
      companyId: true,
      scope: true,
      expiresAt: true,
      revokedAt: true,
    },
  });

  if (!accessToken) return null;
  if (accessToken.revokedAt) return null;
  if (accessToken.expiresAt <= new Date()) return null;

  const scopes = normalizeScopes(accessToken.scope, []);
  if (!scopes) return null;

  prisma.oAuthAccessToken
    .update({
      where: { id: accessToken.id },
      data: { lastUsedAt: new Date() },
    })
    .catch((error) => console.error("Failed to update MCP OAuth token lastUsedAt", error));

  return {
    clientId: accessToken.clientId,
    userId: accessToken.userId,
    companyId: accessToken.companyId,
    scopes,
  } satisfies McpAuthInfo;
}

export async function requireMcpScope(request: Request | null, requiredScope: OAuthScope) {
  if (!request) {
    return { ok: false as const, status: 401, message: "Authentication required." };
  }

  const auth = await getBearerAuthInfo(request);
  if (!auth) {
    return { ok: false as const, status: 401, message: "Authentication required." };
  }

  if (!hasScope(auth.scopes, requiredScope)) {
    return { ok: false as const, status: 403, message: `Missing required scope: ${requiredScope}` };
  }

  return { ok: true as const, auth };
}
