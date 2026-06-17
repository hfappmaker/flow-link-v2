import { NextResponse } from "next/server";
import { filterValidRedirectUris, normalizeScopes, randomToken, scopeString } from "@/lib/mcp-oauth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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
  const body = (await request.json().catch(() => null)) as ClientRegistrationRequest | null;
  if (!body) return oauthError("invalid_client_metadata", "Request body must be JSON.", 400);
  if (!Array.isArray(body.redirect_uris) || body.redirect_uris.length === 0) {
    return oauthError("invalid_redirect_uri", "redirect_uris is required.", 400);
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

  const scopes = normalizeScopes(body.scope, [
    "company_profile:read",
    "company_profile:write",
    "engineer_profile:read",
    "engineer_profile:write",
    "project:read",
    "project:write",
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
      clientUri: body.client_uri,
      logoUri: body.logo_uri,
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
      client_uri: client.clientUri,
      logo_uri: client.logoUri,
    },
    { status: 201 },
  );
}

function oauthError(error: string, errorDescription: string, status: number) {
  return NextResponse.json({ error, error_description: errorDescription }, { status });
}
