import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  hashToken,
  isSameOAuthResource,
  isValidMcpResource,
  normalizeOAuthResource,
  randomToken,
  secondsFromNow,
  verifyPkceS256,
} from "@/lib/mcp-oauth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return oauthError("invalid_request", "Expected application/x-www-form-urlencoded body.", 400);

  const grantType = stringValue(form, "grant_type");
  if (grantType === "authorization_code") return exchangeAuthorizationCode(form);
  if (grantType === "refresh_token") return refreshAccessToken(form);
  return oauthError("unsupported_grant_type", "Unsupported grant_type.", 400);
}

async function exchangeAuthorizationCode(form: FormData) {
  const clientId = stringValue(form, "client_id");
  const code = stringValue(form, "code");
  const redirectUri = stringValue(form, "redirect_uri");
  const resource = stringValue(form, "resource");
  const codeVerifier = stringValue(form, "code_verifier");
  if (!clientId || !code || !redirectUri || !resource || !codeVerifier) {
    return oauthError("invalid_request", "client_id, code, redirect_uri, resource, and code_verifier are required.", 400);
  }
  if (!isValidMcpResource(resource)) return oauthError("invalid_target", "Unsupported resource.", 400);

  const client = await prisma.oAuthClient.findUnique({ where: { clientId } });
  if (!client || !client.redirectUris.includes(redirectUri)) {
    return oauthError("invalid_client", "Unknown client or redirect_uri.", 400);
  }

  const codeRecord = await prisma.oAuthAuthorizationCode.findUnique({
    where: { codeHash: hashToken(code) },
  });
  if (!codeRecord || codeRecord.clientId !== clientId || codeRecord.redirectUri !== redirectUri) {
    return oauthError("invalid_grant", "Invalid authorization code.", 400);
  }
  if (!isSameOAuthResource(codeRecord.resource, resource)) {
    return oauthError("invalid_target", "Authorization code was not issued for this resource.", 400);
  }
  if (codeRecord.usedAt) return oauthError("invalid_grant", "Authorization code has already been used.", 400);
  if (codeRecord.expiresAt <= new Date()) return oauthError("invalid_grant", "Authorization code has expired.", 400);
  if (codeRecord.codeChallengeMethod !== "S256" || !verifyPkceS256(codeVerifier, codeRecord.codeChallenge)) {
    return oauthError("invalid_grant", "PKCE verification failed.", 400);
  }

  const accessToken = randomToken();
  const refreshToken = randomToken();
  const tokenResource = normalizeOAuthResource(resource)!;

  await prisma.$transaction([
    prisma.oAuthAuthorizationCode.update({
      where: { id: codeRecord.id },
      data: { usedAt: new Date() },
    }),
    prisma.oAuthAccessToken.create({
      data: {
        tokenHash: hashToken(accessToken),
        clientId,
        userId: codeRecord.userId,
        companyId: codeRecord.companyId,
        resource: tokenResource,
        scope: codeRecord.scope,
        expiresAt: secondsFromNow(ACCESS_TOKEN_TTL_SECONDS),
      },
    }),
    prisma.oAuthRefreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        clientId,
        userId: codeRecord.userId,
        companyId: codeRecord.companyId,
        resource: tokenResource,
        scope: codeRecord.scope,
        expiresAt: secondsFromNow(REFRESH_TOKEN_TTL_SECONDS),
      },
    }),
  ]);

  return tokenResponse(accessToken, refreshToken, codeRecord.scope);
}

async function refreshAccessToken(form: FormData) {
  const clientId = stringValue(form, "client_id");
  const refreshToken = stringValue(form, "refresh_token");
  const resource = stringValue(form, "resource");
  if (!clientId || !refreshToken || !resource) {
    return oauthError("invalid_request", "client_id, refresh_token, and resource are required.", 400);
  }
  if (!isValidMcpResource(resource)) return oauthError("invalid_target", "Unsupported resource.", 400);

  const tokenRecord = await prisma.oAuthRefreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
  });
  if (!tokenRecord || tokenRecord.clientId !== clientId) {
    return oauthError("invalid_grant", "Invalid refresh token.", 400);
  }
  if (!isSameOAuthResource(tokenRecord.resource, resource)) {
    return oauthError("invalid_target", "Refresh token was not issued for this resource.", 400);
  }
  if (tokenRecord.revokedAt) return oauthError("invalid_grant", "Refresh token has been revoked.", 400);
  if (tokenRecord.expiresAt <= new Date()) return oauthError("invalid_grant", "Refresh token has expired.", 400);

  const accessToken = randomToken();
  const nextRefreshToken = randomToken();
  const tokenResource = normalizeOAuthResource(resource)!;
  await prisma.$transaction([
    prisma.oAuthRefreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date(), lastUsedAt: new Date() },
    }),
    prisma.oAuthAccessToken.create({
      data: {
        tokenHash: hashToken(accessToken),
        clientId,
        userId: tokenRecord.userId,
        companyId: tokenRecord.companyId,
        resource: tokenResource,
        scope: tokenRecord.scope,
        expiresAt: secondsFromNow(ACCESS_TOKEN_TTL_SECONDS),
      },
    }),
    prisma.oAuthRefreshToken.create({
      data: {
        tokenHash: hashToken(nextRefreshToken),
        clientId,
        userId: tokenRecord.userId,
        companyId: tokenRecord.companyId,
        resource: tokenResource,
        scope: tokenRecord.scope,
        expiresAt: secondsFromNow(REFRESH_TOKEN_TTL_SECONDS),
      },
    }),
  ]);

  return tokenResponse(accessToken, nextRefreshToken, tokenRecord.scope);
}

function tokenResponse(accessToken: string, refreshToken: string, scope: string) {
  return NextResponse.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    refresh_token: refreshToken,
    refresh_token_expires_in: REFRESH_TOKEN_TTL_SECONDS,
    scope,
  });
}

function stringValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

function oauthError(error: string, errorDescription: string, status: number) {
  return NextResponse.json(
    { error, error_description: errorDescription },
    {
      status,
      headers: status === 401 ? { "WWW-Authenticate": "Bearer" } : undefined,
    },
  );
}
