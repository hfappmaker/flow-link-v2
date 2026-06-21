import crypto from "node:crypto";
import { getAppUrl } from "@/lib/app-url";

export const OAUTH_SCOPES = [
  "company_profile:read",
  "company_profile:write",
  "engineer_profile:read",
  "engineer_profile:write",
  "engineer_search:read",
  "public_project:read",
  "company_project:read",
  "company_project:write",
] as const;
export type OAuthScope = (typeof OAUTH_SCOPES)[number];

export const MCP_ENDPOINTS = ["company", "engineer"] as const;
export type McpEndpoint = (typeof MCP_ENDPOINTS)[number];

const PROTECTED_RESOURCE_SCOPES = {
  company: [
    "company_profile:read",
    "company_profile:write",
    "public_project:read",
    "company_project:read",
    "company_project:write",
    "engineer_search:read",
  ],
  engineer: ["public_project:read", "engineer_profile:read", "engineer_profile:write"],
} satisfies Record<McpEndpoint, OAuthScope[]>;

export const AUTHORIZATION_CODE_TTL_SECONDS = 5 * 60;
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
export const CONSENT_TOKEN_TTL_SECONDS = 10 * 60;

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

function isMcpEndpoint(value: string | undefined): value is McpEndpoint {
  return MCP_ENDPOINTS.includes(value as McpEndpoint);
}

export function getMcpEndpointFromRequest(requestOrOrigin?: Request | string): McpEndpoint {
  if (requestOrOrigin && typeof requestOrOrigin !== "string") {
    const url = new URL(requestOrOrigin.url);
    const endpoint = parseMcpEndpointFromPath(url.pathname);
    if (endpoint) return endpoint;
  }

  if (typeof requestOrOrigin === "string") {
    try {
      const url = new URL(requestOrOrigin);
      const endpoint = parseMcpEndpointFromPath(url.pathname);
      if (endpoint) return endpoint;
    } catch {
      // A plain origin string has no persona path, so use the company endpoint.
    }
  }

  return "company";
}

function parseMcpEndpointFromPath(pathname: string) {
  const directMatch = pathname.match(/^\/api\/mcp\/([^/]+)$/);
  if (isMcpEndpoint(directMatch?.[1])) return directMatch[1];

  const metadataMatch = pathname.match(/^\/\.well-known\/oauth-protected-resource\/api\/mcp\/([^/]+)$/);
  if (isMcpEndpoint(metadataMatch?.[1])) return metadataMatch[1];

  return null;
}

export function getMcpEndpointFromResource(resource: string) {
  const normalized = normalizeOAuthResource(resource);
  if (!normalized) return null;
  return parseMcpEndpointFromPath(new URL(normalized).pathname);
}

export function isMcpResourceAllowedForSubject(resource: string, kind: OAuthSubjectKind) {
  const endpoint = getMcpEndpointFromResource(resource);
  if (!endpoint) return false;
  if (endpoint === "company") return kind === "company";
  if (endpoint === "engineer") return kind === "engineer";
  return false;
}

export function getMcpResourceUrl(requestOrOrigin?: Request | string, endpoint = getMcpEndpointFromRequest(requestOrOrigin)) {
  return `${getOAuthIssuer(requestOrOrigin)}/api/mcp/${endpoint}`;
}

export function getMcpResourceUrls(requestOrOrigin?: Request | string) {
  return MCP_ENDPOINTS.map((endpoint) => getMcpResourceUrl(requestOrOrigin, endpoint));
}

export function getMcpResourceMetadataUrl(
  requestOrOrigin?: Request | string,
  endpoint = getMcpEndpointFromRequest(requestOrOrigin),
) {
  return `${getOAuthIssuer(requestOrOrigin)}/.well-known/oauth-protected-resource/api/mcp/${endpoint}`;
}

function withVercelProtectionBypass(url: string, issuer: string) {
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (!bypassSecret) return url;

  const issuerUrl = new URL(issuer);
  if (!issuerUrl.hostname.endsWith(".vercel.app")) return url;

  const endpointUrl = new URL(url);
  endpointUrl.searchParams.set("x-vercel-protection-bypass", bypassSecret);
  return endpointUrl.toString();
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
  const endpoint = parseMcpEndpointFromPath(url.pathname);
  if (!endpoint) return false;
  if (!isAllowedOAuthOrigin(url.origin)) return false;

  return normalized === normalizeOAuthResource(getMcpResourceUrl(url.origin, endpoint));
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
    authorization_endpoint: withVercelProtectionBypass(`${issuer}/oauth/authorize`, issuer),
    token_endpoint: withVercelProtectionBypass(`${issuer}/oauth/token`, issuer),
    registration_endpoint: withVercelProtectionBypass(`${issuer}/oauth/register`, issuer),
    revocation_endpoint: withVercelProtectionBypass(`${issuer}/oauth/revoke`, issuer),
    protected_resources: getMcpResourceUrls(issuer),
    scopes_supported: OAUTH_SCOPES,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
  };
}

export function getProtectedResourceMetadata(requestOrOrigin?: Request | string) {
  const issuer = getOAuthIssuer(requestOrOrigin);
  const endpoint = getMcpEndpointFromRequest(requestOrOrigin);
  return {
    resource: getMcpResourceUrl(issuer, endpoint),
    authorization_servers: [issuer],
    scopes_supported: PROTECTED_RESOURCE_SCOPES[endpoint],
    bearer_methods_supported: ["header"],
  };
}

export function getDefaultScopesForMcpResource(resource: string) {
  const normalized = normalizeOAuthResource(resource);
  if (!normalized) return ["public_project:read"] satisfies OAuthScope[];

  const endpoint = parseMcpEndpointFromPath(new URL(normalized).pathname);
  return endpoint ? PROTECTED_RESOURCE_SCOPES[endpoint] : (["public_project:read"] satisfies OAuthScope[]);
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
    `resource_metadata=${quoteWwwAuthenticateValue(getMcpResourceMetadataUrl(requestOrOrigin))}`,
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

function base64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function parseBase64UrlJson(value: string) {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;
  } catch {
    return null;
  }
}

function signHmac(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function getOAuthTokenSecret() {
  const secret = process.env.MCP_OAUTH_JWT_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("MCP OAuth JWT signing requires MCP_OAUTH_JWT_SECRET or AUTH_SECRET.");
  }
  return secret;
}

function currentUnixTime() {
  return Math.floor(Date.now() / 1000);
}

type McpAccessTokenClaims = {
  typ: "mcp_access_token";
  iss: string;
  aud: string;
  sub: string;
  client_id: string;
  company_id: string | null;
  scope: string;
  iat: number;
  exp: number;
};

export function issueMcpAccessToken({
  clientId,
  userId,
  companyId,
  resource,
  scope,
}: {
  clientId: string;
  userId: string;
  companyId: string | null;
  resource: string;
  scope: string;
}) {
  const now = currentUnixTime();
  const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
  const normalizedResource = normalizeOAuthResource(resource);
  if (!normalizedResource) throw new Error("Cannot issue MCP access token for an invalid resource.");
  const issuer = getOAuthIssuer(new URL(normalizedResource).origin);
  const payload = base64UrlJson({
    typ: "mcp_access_token",
    iss: issuer,
    aud: normalizedResource,
    sub: userId,
    client_id: clientId,
    company_id: companyId,
    scope,
    iat: now,
    exp: now + ACCESS_TOKEN_TTL_SECONDS,
  } satisfies McpAccessTokenClaims);
  const signingInput = `${header}.${payload}`;
  return `${signingInput}.${signHmac(signingInput, getOAuthTokenSecret())}`;
}

function isMcpAccessTokenClaims(value: unknown): value is McpAccessTokenClaims {
  if (!value || typeof value !== "object") return false;
  const claims = value as Record<string, unknown>;
  return (
    claims.typ === "mcp_access_token" &&
    typeof claims.iss === "string" &&
    typeof claims.aud === "string" &&
    typeof claims.sub === "string" &&
    typeof claims.client_id === "string" &&
    (typeof claims.company_id === "string" || claims.company_id === null) &&
    typeof claims.scope === "string" &&
    typeof claims.iat === "number" &&
    typeof claims.exp === "number"
  );
}

export function verifyMcpAccessToken(token: string, requestOrOrigin?: Request | string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const signingInput = `${header}.${payload}`;
  const expectedSignature = signHmac(signingInput, getOAuthTokenSecret());
  if (!timingSafeEqual(signature, expectedSignature)) return null;

  const claims = parseBase64UrlJson(payload);
  if (!isMcpAccessTokenClaims(claims)) return null;
  if (claims.exp <= currentUnixTime()) return null;
  if (!isSameOAuthResource(claims.aud, getMcpResourceUrl(requestOrOrigin))) return null;
  if (claims.iss !== getOAuthIssuer(requestOrOrigin)) return null;

  const scopes = normalizeScopes(claims.scope, []);
  if (!scopes) return null;

  return {
    clientId: claims.client_id,
    userId: claims.sub,
    companyId: claims.company_id,
    resource: normalizeOAuthResource(claims.aud)!,
    scopes,
  } satisfies McpAuthInfo;
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

export function normalizeScopes(scope: string | undefined | null, fallback: OAuthScope[] = ["public_project:read"]) {
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
      (scope) =>
        scope.startsWith("public_project:") ||
        scope.startsWith("company_profile:") ||
        scope.startsWith("company_project:") ||
        scope.startsWith("engineer_search:"),
    );
  }
  if (kind === "engineer") {
    return OAUTH_SCOPES.filter(
      (scope) => scope.startsWith("public_project:") || scope.startsWith("engineer_profile:"),
    );
  }
  return OAUTH_SCOPES.filter(
    (scope) => scope.startsWith("company_profile:") || scope.startsWith("engineer_profile:"),
  );
}

export function filterAllowedScopes(scopes: OAuthScope[], kind: OAuthSubjectKind) {
  const allowedScopes = getAllowedScopesForSubject(kind);
  return scopes.filter((scope) => allowedScopes.includes(scope));
}

type OAuthConsentClaims = {
  typ: "mcp_consent";
  userId: string;
  clientId: string;
  redirectUri: string;
  resource: string;
  scope: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
  exp: number;
};

export function createOAuthConsentToken(claims: Omit<OAuthConsentClaims, "typ" | "exp">) {
  const payload = base64UrlJson({
    typ: "mcp_consent",
    ...claims,
    exp: currentUnixTime() + CONSENT_TOKEN_TTL_SECONDS,
  } satisfies OAuthConsentClaims);
  return `${payload}.${signHmac(payload, getOAuthTokenSecret())}`;
}

function isOAuthConsentClaims(value: unknown): value is OAuthConsentClaims {
  if (!value || typeof value !== "object") return false;
  const claims = value as Record<string, unknown>;
  return (
    claims.typ === "mcp_consent" &&
    typeof claims.userId === "string" &&
    typeof claims.clientId === "string" &&
    typeof claims.redirectUri === "string" &&
    typeof claims.resource === "string" &&
    typeof claims.scope === "string" &&
    typeof claims.codeChallenge === "string" &&
    claims.codeChallengeMethod === "S256" &&
    typeof claims.exp === "number"
  );
}

export function verifyOAuthConsentToken(token: string) {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  if (!timingSafeEqual(signature, signHmac(payload, getOAuthTokenSecret()))) return null;

  const claims = parseBase64UrlJson(payload);
  if (!isOAuthConsentClaims(claims)) return null;
  if (claims.exp <= currentUnixTime()) return null;
  return claims;
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

  return verifyMcpAccessToken(match[1].trim(), request);
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
