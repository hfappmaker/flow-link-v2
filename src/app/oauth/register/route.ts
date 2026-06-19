import { NextResponse } from "next/server";
import { filterValidRedirectUris, normalizeScopes, randomToken, scopeString } from "@/lib/mcp-oauth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const MAX_REDIRECT_URIS = 10;
const MAX_METADATA_URL_LENGTH = 1000;
const REGISTRATION_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const REGISTRATION_RATE_LIMIT_MAX = 20;
const registrationAttempts = new Map<string, { count: number; resetAt: number }>();

type ClientRegistrationRequest = {
  client_name?: string;
  redirect_uris?: string[];
  grant_types?: string[];
  response_types?: string[];
  token_endpoint_auth_method?: string;
  scope?: string;
  client_uri?: string;
  logo_uri?: string;
};

export async function POST(request: Request) {
  const rateLimit = checkRegistrationRateLimit(request);
  if (!rateLimit.ok) {
    return oauthError("slow_down", "Too many client registrations. Try again later.", 429, {
      "Retry-After": String(rateLimit.retryAfter),
    });
  }

  const body = (await request.json().catch(() => null)) as ClientRegistrationRequest | null;
  if (!body) return oauthError("invalid_client_metadata", "Request body must be JSON.", 400);
  if (!Array.isArray(body.redirect_uris) || body.redirect_uris.length === 0) {
    return oauthError("invalid_redirect_uri", "redirect_uris is required.", 400);
  }
  if (body.redirect_uris.length > MAX_REDIRECT_URIS) {
    return oauthError("invalid_redirect_uri", `redirect_uris must contain at most ${MAX_REDIRECT_URIS} entries.`, 400);
  }
  if (body.redirect_uris.some((uri) => typeof uri !== "string")) {
    return oauthError("invalid_redirect_uri", "redirect_uris must contain only strings.", 400);
  }
  const redirectUris = filterValidRedirectUris(body.redirect_uris);
  if (redirectUris.length === 0) {
    return oauthError("invalid_redirect_uri", "At least one redirect URI must be HTTPS or localhost HTTP.", 400);
  }

  const grantTypes = body.grant_types ?? ["authorization_code", "refresh_token"];
  const responseTypes = body.response_types ?? ["code"];
  if (grantTypes.some((grant) => !["authorization_code", "refresh_token"].includes(grant))) {
    return oauthError("invalid_client_metadata", "Unsupported grant type.", 400);
  }
  if (responseTypes.some((responseType) => responseType !== "code")) {
    return oauthError("invalid_client_metadata", "Only code response_type is supported.", 400);
  }
  if ((body.token_endpoint_auth_method ?? "none") !== "none") {
    return oauthError("invalid_client_metadata", "Only public PKCE clients are supported.", 400);
  }

  const clientUri = optionalMetadataUrl(body.client_uri);
  const logoUri = optionalMetadataUrl(body.logo_uri);
  if (clientUri === null || logoUri === null) {
    return oauthError("invalid_client_metadata", "client_uri and logo_uri must be HTTPS URLs when provided.", 400);
  }

  const scopes = normalizeScopes(body.scope, [
    "company_profile:read",
    "company_profile:write",
    "engineer_profile:read",
    "engineer_profile:write",
    "engineer_search:read",
    "public_project:read",
    "company_project:read",
    "company_project:write",
  ]);
  if (!scopes) return oauthError("invalid_scope", "Unsupported scope.", 400);

  const client = await prisma.oAuthClient.create({
    data: {
      clientId: `fl_${randomToken(18)}`,
      clientName: body.client_name?.slice(0, 200),
      redirectUris,
      grantTypes,
      responseTypes,
      tokenEndpointAuthMethod: "none",
      scope: scopeString(scopes),
      clientUri,
      logoUri,
    },
  });

  return NextResponse.json(
    {
      client_id: client.clientId,
      client_name: client.clientName,
      redirect_uris: client.redirectUris,
      grant_types: client.grantTypes,
      response_types: client.responseTypes,
      token_endpoint_auth_method: client.tokenEndpointAuthMethod,
      scope: client.scope,
      ...(client.clientUri ? { client_uri: client.clientUri } : {}),
      ...(client.logoUri ? { logo_uri: client.logoUri } : {}),
    },
    { status: 201 },
  );
}

function optionalMetadataUrl(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.length > MAX_METADATA_URL_LENGTH) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.hash) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function checkRegistrationRateLimit(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const current = registrationAttempts.get(key);
  if (!current || current.resetAt <= now) {
    registrationAttempts.set(key, { count: 1, resetAt: now + REGISTRATION_RATE_LIMIT_WINDOW_MS });
    return { ok: true as const };
  }

  if (current.count >= REGISTRATION_RATE_LIMIT_MAX) {
    return {
      ok: false as const,
      retryAfter: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  return { ok: true as const };
}

function oauthError(error: string, errorDescription: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ error, error_description: errorDescription }, { status, headers });
}
