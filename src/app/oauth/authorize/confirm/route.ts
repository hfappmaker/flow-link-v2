import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  AUTHORIZATION_CODE_TTL_SECONDS,
  filterAllowedScopes,
  hashToken,
  isValidMcpResource,
  normalizeOAuthResource,
  normalizeScopes,
  OAUTH_SCOPES,
  randomToken,
  scopeString,
  secondsFromNow,
  verifyOAuthConsentToken,
  type OAuthSubjectKind,
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
  const resource = stringValue(form, "resource");
  const requestedScope = stringValue(form, "scope");
  const state = stringValue(form, "state");
  const codeChallenge = stringValue(form, "code_challenge");
  const codeChallengeMethod = stringValue(form, "code_challenge_method");
  const consentToken = stringValue(form, "consent_token");

  const validation = await validateRequest({
    userId: session.user.id,
    responseType,
    clientId,
    redirectUri,
    resource,
    requestedScope,
    codeChallenge,
    codeChallengeMethod,
    consentToken,
  });
  if (!validation.ok) return redirectWithError(redirectUri, validation.error, state);

  const membership = await prisma.companyMember.findUnique({
    where: { userId: session.user.id },
    select: { companyId: true },
  });
  const engineerProfile = await prisma.engineerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const subjectKind: OAuthSubjectKind = membership ? "company" : engineerProfile ? "engineer" : "unregistered";
  const allowedGrantedScopes = filterAllowedScopes(validation.scopes, subjectKind);
  if (allowedGrantedScopes.length === 0) {
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
      resource: validation.resource,
      scope: scopeString(allowedGrantedScopes),
      codeChallenge,
      codeChallengeMethod: "S256",
      expiresAt: secondsFromNow(AUTHORIZATION_CODE_TTL_SECONDS),
    },
  });

  const url = new URL(redirectUri);
  url.searchParams.set("code", code);
  if (state) url.searchParams.set("state", state);
  return redirectToOAuthClient(url, { success: true });
}

async function validateRequest({
  userId,
  responseType,
  clientId,
  redirectUri,
  resource,
  requestedScope,
  codeChallenge,
  codeChallengeMethod,
  consentToken,
}: {
  userId: string;
  responseType: string;
  clientId: string;
  redirectUri: string;
  resource: string;
  requestedScope: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  consentToken: string;
}) {
  if (responseType !== "code") return { ok: false as const, error: "unsupported_response_type" };
  if (!clientId || !redirectUri || !resource || !codeChallenge || !consentToken) {
    return { ok: false as const, error: "invalid_request" };
  }
  if (!isValidMcpResource(resource)) return { ok: false as const, error: "invalid_target" };
  if (codeChallengeMethod !== "S256") return { ok: false as const, error: "invalid_request" };

  const client = await prisma.oAuthClient.findUnique({ where: { clientId } });
  if (!client || !client.redirectUris.includes(redirectUri)) {
    return { ok: false as const, error: "invalid_request" };
  }

  const requestedScopes = normalizeScopes(requestedScope, ["company_profile:read"]);
  const clientScopes = normalizeScopes(client.scope, [...OAUTH_SCOPES]);
  if (!requestedScopes || !clientScopes || requestedScopes.some((scope) => !clientScopes.includes(scope))) {
    return { ok: false as const, error: "invalid_scope" };
  }
  const normalizedResource = normalizeOAuthResource(resource)!;
  const consent = verifyOAuthConsentToken(consentToken);
  if (
    !consent ||
    consent.userId !== userId ||
    consent.clientId !== clientId ||
    consent.redirectUri !== redirectUri ||
    !isSameConsentResource(consent.resource, normalizedResource) ||
    consent.scope !== scopeString(requestedScopes) ||
    consent.codeChallenge !== codeChallenge ||
    consent.codeChallengeMethod !== "S256"
  ) {
    return { ok: false as const, error: "invalid_request" };
  }

  return { ok: true as const, resource: normalizedResource, scopes: requestedScopes };
}

function isSameConsentResource(left: string, right: string) {
  return normalizeOAuthResource(left) === normalizeOAuthResource(right);
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
  return redirectToOAuthClient(url, { success: false });
}

function stringValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

function redirectToOAuthClient(url: URL, { success }: { success: boolean }) {
  if (["http:", "https:"].includes(url.protocol)) {
    return NextResponse.redirect(url, { status: 303 });
  }

  return new NextResponse(oAuthClientCallbackHtml(url, success), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

function oAuthClientCallbackHtml(url: URL, success: boolean) {
  const callbackUrl = url.toString();
  const title = success ? "FlowLink MCP連携が完了しました" : "FlowLink MCP連携を完了できませんでした";
  const message = success
    ? "MCPクライアントに認証結果を戻しています。このタブは閉じても大丈夫です。"
    : "MCPクライアントにエラー内容を戻しています。このタブは閉じても大丈夫です。";

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      body {
        align-items: center;
        background: #f8fafc;
        color: #0f172a;
        display: flex;
        justify-content: center;
        margin: 0;
        min-height: 100vh;
      }
      main {
        max-width: 520px;
        padding: 32px;
        text-align: center;
      }
      .mark {
        align-items: center;
        background: ${success ? "#16a34a" : "#dc2626"};
        border-radius: 999px;
        color: white;
        display: inline-flex;
        font-size: 28px;
        font-weight: 800;
        height: 64px;
        justify-content: center;
        width: 64px;
      }
      h1 {
        font-size: 28px;
        line-height: 1.25;
        margin: 24px 0 12px;
      }
      p {
        color: #475569;
        font-size: 15px;
        line-height: 1.8;
        margin: 0;
      }
      a {
        align-items: center;
        background: #2563eb;
        border-radius: 8px;
        color: white;
        display: inline-flex;
        font-size: 14px;
        font-weight: 700;
        justify-content: center;
        margin-top: 24px;
        min-height: 44px;
        padding: 0 18px;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <main>
      <div class="mark">${success ? "✓" : "!"}</div>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
      <a href="${escapeHtml(callbackUrl)}">MCPクライアントを開く</a>
    </main>
    <script>
      window.setTimeout(function () {
        window.location.href = ${JSON.stringify(callbackUrl)};
      }, 100);
    </script>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}
