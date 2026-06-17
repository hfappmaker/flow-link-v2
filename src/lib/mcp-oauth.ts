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
  resource: string;
  scopes: OAuthScope[];
};

export type OAuthSubjectKind = "company" | "engineer" | "unregistered";

export function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getRequestOrigin(request: Request) {
  return new URL(request.url).origin;
}

export function getOAuthIssuer(requestOrOrigin?: Request | string) {
  if (process.env.OAUTH_ISSUER) return stripTrailingSlash(process.env.OAUTH_ISSUER);
  if (typeof requestOrOrigin === "string" && isAllowedOAuthOrigin(requestOrOrigin)) {
    return stripTrailingSlash(requestOrOrigin);
  }
  if (requestOrOrigin && typeof requestOrOrigin !== "string") {
    const origin = getRequestOrigin(requestOrOrigin);
    if (isAllowedOAuthOrigin(origin)) return stripTrailingSlash(origin);
  }
  return stripTrailingSlash(getAppUrl());
}

export function isAllowedOAuthOrigin(origin: string) {
  try {
    const url = new URL(origin);
    const appUrl = new URL(getAppUrl());
    const configuredOrigins = (process.env.OAUTH_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => stripTrailingSlash(value));

    if (configuredOrigins.includes(stripTrailingSlash(url.origin))) return true;
    if (url.origin === appUrl.origin) return true;
    if (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return true;
    if (url.protocol === "https:" && url.hostname.endsWith(".vercel.app")) return true;
    return false;
  } catch {
    return false;
  }
}

export function getMcpResourceUrl(requestOrOrigin?: Request | string) {
  return `${getOAuthIssuer(requestOrOrigin)}/api/mcp`;
}

export function normalizeOAuthResource(value: string) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (url.hash || url.search) return null;
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    return stripTrailingSlash(url.toString());
  } catch {
    return null;
  }
}

export function isValidMcpResource(value: string) {
  const normalized = normalizeOAuthResource(value);
  if (!normalized) return false;

  const url = new URL(normalized);
  if (url.pathname !== "/api/mcp") return false;
  if (!isAllowedOAuthOrigin(url.origin)) return false;

  return normalized === normalizeOAuthResource(getMcpResourceUrl(url.origin));
}

export function isSameOAuthResource(left: string, right: string) {
  const normalizedLeft = normalizeOAuthResource(left);
  const normalizedRight = normalizeOAuthResource(right);
  return !!normalizedLeft && !!normalizedRight && normalizedLeft === normalizedRight;
}

export function getOAuthMetadata(requestOrOrigin?: Request | string) {
  const issuer = getOAuthIssuer(requestOrOrigin);
  return {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    registration_endpoint: `${issuer}/oauth/register`,
    scopes_supported: OAUTH_SCOPES,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
  };
}

export function getProtectedResourceMetadata(requestOrOrigin?: Request | string) {
  const issuer = getOAuthIssuer(requestOrOrigin);
  return {
    resource: getMcpResourceUrl(issuer),
    authorization_servers: [issuer],
    scopes_supported: OAUTH_SCOPES,
    bearer_methods_supported: ["header"],
  };
}

function quoteWwwAuthenticateValue(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function getWwwAuthenticateHeader(
  requestOrOrigin?: Request | string,
  options?: {
    error?: string;
    errorDescription?: string;
    scope?: OAuthScope | OAuthScope[] | string;
  },
) {
  const params: string[] = [];
  if (options?.error) params.push(`error=${quoteWwwAuthenticateValue(options.error)}`);
  if (options?.scope) {
    const scope = Array.isArray(options.scope) ? scopeString(options.scope) : options.scope;
    params.push(`scope=${quoteWwwAuthenticateValue(scope)}`);
  }
  params.push(
    `resource_metadata=${quoteWwwAuthenticateValue(`${getOAuthIssuer(requestOrOrigin)}/.well-known/oauth-protected-resource`)}`,
  );
  if (options?.errorDescription) {
    params.push(`error_description=${quoteWwwAuthenticateValue(options.errorDescription)}`);
  }
  return `Bearer ${params.join(", ")}`;
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

export function getAllowedScopesForSubject(kind: OAuthSubjectKind) {
  if (kind === "company") {
    return OAUTH_SCOPES.filter(
      (scope) => scope.startsWith("company_profile:") || scope.startsWith("project:"),
    );
  }
  if (kind === "engineer") {
    return OAUTH_SCOPES.filter((scope) => scope.startsWith("engineer_profile:"));
  }
  return OAUTH_SCOPES.filter(
    (scope) => scope.startsWith("company_profile:") || scope.startsWith("engineer_profile:"),
  );
}

export function filterAllowedScopes(scopes: OAuthScope[], kind: OAuthSubjectKind) {
  const allowedScopes = getAllowedScopesForSubject(kind);
  return scopes.filter((scope) => allowedScopes.includes(scope));
}

export function isValidRedirectUri(value: string) {
  try {
    const url = new URL(value);
    if (url.hash) return false;
    if (url.protocol === "https:") return true;
    if (url.protocol !== "http:") return isValidPrivateUseRedirectUri(url);
    return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}

const BLOCKED_PRIVATE_USE_REDIRECT_SCHEMES = new Set([
  "about:",
  "blob:",
  "data:",
  "file:",
  "javascript:",
  "vbscript:",
]);

function isValidPrivateUseRedirectUri(url: URL) {
  if (BLOCKED_PRIVATE_USE_REDIRECT_SCHEMES.has(url.protocol)) return false;
  return /^[a-z][a-z0-9+.-]*:$/.test(url.protocol);
}

export function filterValidRedirectUris(values: string[]) {
  return values.filter((value) => isValidRedirectUri(value));
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
      resource: true,
      scope: true,
      expiresAt: true,
      revokedAt: true,
    },
  });

  if (!accessToken) return null;
  if (accessToken.revokedAt) return null;
  if (accessToken.expiresAt <= new Date()) return null;
  if (!isSameOAuthResource(accessToken.resource, getMcpResourceUrl(request))) return null;

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
    resource: accessToken.resource,
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
