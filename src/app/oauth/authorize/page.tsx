import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import {
  createOAuthConsentToken,
  getAllowedScopesForSubject,
  isValidMcpResource,
  normalizeScopes,
  OAUTH_SCOPES,
  scopeString,
  type OAuthScope,
  type OAuthSubjectKind,
} from "@/lib/mcp-oauth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type AuthorizeParams = {
  response_type?: string;
  client_id?: string;
  redirect_uri?: string;
  resource?: string;
  scope?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
};

export default async function OAuthAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<AuthorizeParams>;
}) {
  const params = await searchParams;
  const validation = await validateAuthorizeParams(params);
  if (!validation.ok) return <AuthorizeError message={validation.message} />;

  const session = await auth();
  if (!session?.user?.id) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) query.set(key, value);
    }
    redirect(`/login?callbackUrl=${encodeURIComponent(`/oauth/authorize?${query.toString()}`)}`);
  }

  const [membership, engineerProfile] = await Promise.all([
    prisma.companyMember.findUnique({
      where: { userId: session.user.id },
      include: { company: { select: { name: true } } },
    }),
    prisma.engineerProfile.findUnique({
      where: { userId: session.user.id },
      select: { displayName: true },
    }),
  ]);
  const subjectKind: OAuthSubjectKind = membership ? "company" : engineerProfile ? "engineer" : "unregistered";
  const allowedScopes = getAllowedScopesForSubject(subjectKind);
  const grantedScopes = validation.scopes.filter((scope) => allowedScopes.includes(scope));
  const consentToken = createOAuthConsentToken({
    userId: session.user.id,
    clientId: validation.client.clientId,
    redirectUri: params.redirect_uri!,
    resource: params.resource!,
    scope: scopeString(validation.scopes),
    codeChallenge: params.code_challenge!,
    codeChallengeMethod: "S256",
  });

  const clientName = validation.client.clientName ?? "MCPクライアント";
  const accountName = membership?.company.name ?? engineerProfile?.displayName ?? session.user.email ?? "このアカウント";

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-black text-slate-900">FlowLink MCP連携</h1>
      <p className="mt-2 text-sm text-slate-600">
        {clientName} が {accountName} へのアクセス許可をリクエストしています。
      </p>

      <Card className="mt-6">
        <CardBody className="p-6">
          <form method="post" action="/oauth/authorize/confirm" className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">要求された権限</h2>
              <div className="mt-3 space-y-2">
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                  <span className="block font-semibold text-blue-950">公開案件の検索</span>
                  <span className="mt-0.5 block text-xs leading-relaxed">
                    ログイン済みのMCPクライアントから、公開案件の検索・詳細取得・検索条件の参照ができます。
                    この項目は常に有効で、scopeは不要です。
                  </span>
                </div>

                {validation.scopes.map((scope) => {
                  const allowed = allowedScopes.includes(scope);
                  return (
                    <div
                      key={scope}
                      className={[
                        "rounded-lg border px-3 py-2 text-sm",
                        allowed
                          ? "border-slate-200 bg-white text-slate-700"
                          : "border-slate-200 bg-slate-50 text-slate-400",
                      ].join(" ")}
                    >
                      <span className={["block font-semibold", allowed ? "text-slate-900" : "text-slate-500"].join(" ")}>
                        {SCOPE_LABELS[scope]}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed">
                        {allowed ? SCOPE_DESCRIPTIONS[scope] : unavailableScopeMessage(subjectKind)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {validation.scopes.some((scope) => scope.startsWith("project:")) ? (
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  MCPから案件を公開することはできません。公開はFlowLinkの画面から行ってください。
                </p>
              ) : null}
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                実際に付与される権限は、ログイン中のアカウント種別に応じてFlowLink側で制限されます。
                今回付与される権限は {grantedScopes.length} 件です。
              </p>
            </div>

            {Object.entries(params).map(([key, value]) =>
              value ? <input key={key} type="hidden" name={key} value={value} /> : null,
            )}
            <input type="hidden" name="consent_token" value={consentToken} />
            <div className="flex items-center gap-3">
              <Button type="submit">許可する</Button>
              <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-900">
                キャンセル
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}

const SCOPE_LABELS = {
  "company_profile:read": "企業プロフィールの表示",
  "company_profile:write": "企業プロフィールの登録・更新",
  "engineer_profile:read": "エンジニアプロフィールの表示",
  "engineer_profile:write": "エンジニアプロフィールの登録・更新",
  "project:read": "自社案件の表示",
  "project:write": "案件下書きの作成・更新",
} satisfies Record<OAuthScope, string>;

const SCOPE_DESCRIPTIONS = {
  "company_profile:read": "このアカウントに紐づく企業プロフィールを表示します。",
  "company_profile:write": "企業登録を完了するか、既存の企業プロフィールを更新します。",
  "engineer_profile:read": "このアカウントに紐づくエンジニアプロフィールを表示します。",
  "engineer_profile:write": "エンジニア登録を完了するか、既存のエンジニアプロフィールを更新します。",
  "project:read": "自社が登録した案件を表示します。",
  "project:write": "自社案件の下書きを作成・更新します。公開はWeb画面からのみ行えます。",
} satisfies Record<OAuthScope, string>;

function unavailableScopeMessage(subjectKind: OAuthSubjectKind) {
  if (subjectKind === "company") return "企業アカウントでは利用できない権限です。";
  if (subjectKind === "engineer") return "エンジニアアカウントでは利用できない権限です。";
  return "プロフィール登録前は利用できない権限です。";
}

async function validateAuthorizeParams(params: AuthorizeParams) {
  if (params.response_type !== "code") return { ok: false as const, message: "未対応のresponse_typeです。" };
  if (!params.client_id) return { ok: false as const, message: "client_idが必要です。" };
  if (!params.redirect_uri) return { ok: false as const, message: "redirect_uriが必要です。" };
  if (!params.resource) return { ok: false as const, message: "resourceが必要です。" };
  if (!isValidMcpResource(params.resource)) {
    return { ok: false as const, message: "未対応のresourceです。" };
  }
  if (!params.code_challenge) return { ok: false as const, message: "code_challengeが必要です。" };
  if (params.code_challenge_method !== "S256") {
    return { ok: false as const, message: "PKCEはS256のみ対応しています。" };
  }

  const client = await prisma.oAuthClient.findUnique({ where: { clientId: params.client_id } });
  if (!client) return { ok: false as const, message: "不明なクライアントです。" };
  if (!client.redirectUris.includes(params.redirect_uri)) {
    return { ok: false as const, message: "このクライアントに登録されていないredirect_uriです。" };
  }

  const scopes = normalizeScopes(params.scope, ["company_profile:read"]);
  if (!scopes) return { ok: false as const, message: "未対応のscopeです。" };

  const clientScopes = normalizeScopes(client.scope, [...OAUTH_SCOPES]);
  if (!clientScopes || scopes.some((scope) => !clientScopes.includes(scope))) {
    return { ok: false as const, message: "このクライアントに登録されていないscopeが含まれています。" };
  }

  return { ok: true as const, client, scopes };
}

function AuthorizeError({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-black text-slate-900">FlowLink MCP連携に失敗しました</h1>
      <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {message}
      </p>
    </main>
  );
}
