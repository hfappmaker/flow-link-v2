import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  AUTHORIZATION_CODE_TTL_SECONDS,
  hashToken,
  normalizeScopes,
  OAUTH_SCOPES,
  randomToken,
  scopeString,
  secondsFromNow,
} from "@/lib/mcp-oauth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login", request.url));

  const form = await request.formData();
  const responseType = stringValue(form, "response_type");
  const clientId = stringValue(form, "client_id");
  const redirectUri = stringValue(form, "redirect_uri");
  const requestedScope = stringValue(form, "scope");
  const state = stringValue(form, "state");
  const codeChallenge = stringValue(form, "code_challenge");
  const codeChallengeMethod = stringValue(form, "code_challenge_method");

  const validation = await validateRequest({
    responseType,
    clientId,
    redirectUri,
    requestedScope,
    codeChallenge,
    codeChallengeMethod,
  });
  if (!validation.ok) return redirectWithError(redirectUri, validation.error, state);

  const membership = await prisma.companyMember.findUnique({
    where: { userId: session.user.id },
    select: { companyId: true },
  });
  if (validation.scopes.some((scope) => scope.startsWith("project:")) && !membership) {
    return redirectWithError(redirectUri, "access_denied", state);
  }

  const code = randomToken();
  await prisma.oAuthAuthorizationCode.create({
    data: {
      codeHash: hashToken(code),
      clientId,
      userId: session.user.id,
      companyId: membership?.companyId ?? null,
      redirectUri,
      scope: scopeString(validation.scopes),
      codeChallenge,
      codeChallengeMethod: "S256",
      expiresAt: secondsFromNow(AUTHORIZATION_CODE_TTL_SECONDS),
    },
  });

  const url = new URL(redirectUri);
  url.searchParams.set("code", code);
  if (state) url.searchParams.set("state", state);
  return NextResponse.redirect(url);
}

async function validateRequest({
  responseType,
  clientId,
  redirectUri,
  requestedScope,
  codeChallenge,
  codeChallengeMethod,
}: {
  responseType: string;
  clientId: string;
  redirectUri: string;
  requestedScope: string;
  codeChallenge: string;
  codeChallengeMethod: string;
}) {
  if (responseType !== "code") return { ok: false as const, error: "unsupported_response_type" };
  if (!clientId || !redirectUri || !codeChallenge) return { ok: false as const, error: "invalid_request" };
  if (codeChallengeMethod !== "S256") return { ok: false as const, error: "invalid_request" };

  const client = await prisma.oAuthClient.findUnique({ where: { clientId } });
  if (!client || !client.redirectUris.includes(redirectUri)) {
    return { ok: false as const, error: "invalid_request" };
  }

  const scopes = normalizeScopes(requestedScope, ["company_profile:read"]);
  const clientScopes = normalizeScopes(client.scope, [...OAUTH_SCOPES]);
  if (!scopes || !clientScopes || scopes.some((scope) => !clientScopes.includes(scope))) {
    return { ok: false as const, error: "invalid_scope" };
  }

  return { ok: true as const, scopes };
}

function redirectWithError(redirectUri: string, error: string, state: string) {
  let url: URL;
  try {
    url = new URL(redirectUri);
  } catch {
    url = new URL("/", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  }
  url.searchParams.set("error", error);
  if (state) url.searchParams.set("state", state);
  return NextResponse.redirect(url);
}

function stringValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}
