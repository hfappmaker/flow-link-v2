import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import {
  filterAllowedScopes,
  getAllowedScopesForSubject,
  normalizeScopes,
  OAUTH_SCOPES,
  type OAuthScope,
  type OAuthSubjectKind,
} from "@/lib/mcp-oauth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

export const runtime = "nodejs";

type AuthorizeParams = {
  response_type?: string;
  client_id?: string;
  redirect_uri?: string;
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
  const selectableScopes = filterAllowedScopes(validation.scopes, subjectKind);

  const clientName = validation.client.clientName ?? "MCP client";
  const accountName = membership?.company.name ?? engineerProfile?.displayName ?? session.user.email ?? "your account";
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-black text-slate-900">FlowLink MCP connection</h1>
      <p className="mt-2 text-sm text-slate-600">
        {clientName} is requesting access to {accountName}.
      </p>

      <Card className="mt-6">
        <CardBody className="p-6">
          <form method="post" action="/oauth/authorize/confirm" className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Requested permissions</h2>
              <div className="mt-3 space-y-2">
                {validation.scopes.map((scope) => {
                  const allowed = allowedScopes.includes(scope);
                  return (
                    <label
                      key={scope}
                      className={[
                        "flex items-start gap-3 rounded-lg border px-3 py-2 text-sm",
                        allowed
                          ? "border-slate-200 bg-white text-slate-700"
                          : "border-slate-200 bg-slate-50 text-slate-400",
                      ].join(" ")}
                    >
                      <input
                        type="checkbox"
                        name="granted_scope"
                        value={scope}
                        defaultChecked={allowed}
                        disabled={!allowed}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:text-slate-300"
                      />
                      <span>
                        <span className="block font-semibold text-slate-900">{SCOPE_LABELS[scope]}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed">
                          {allowed ? SCOPE_DESCRIPTIONS[scope] : `Not available for ${subjectKind} accounts.`}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {validation.scopes.some((scope) => scope.startsWith("project:")) ? (
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  Project publishing is not available from MCP.
                </p>
              ) : null}
            </div>
            {Object.entries(params).map(([key, value]) =>
              value ? <input key={key} type="hidden" name={key} value={value} /> : null,
            )}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={selectableScopes.length === 0}>
                Allow selected
              </Button>
              <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-900">
                Cancel
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}

const SCOPE_LABELS = {
  "company_profile:read": "View company profile",
  "company_profile:write": "Register and update company profile",
  "engineer_profile:read": "View engineer profile",
  "engineer_profile:write": "Register and update engineer profile",
  "project:read": "View company projects",
  "project:write": "Create and update project drafts",
} satisfies Record<OAuthScope, string>;

const SCOPE_DESCRIPTIONS = {
  "company_profile:read": "Read the company profile linked to this account.",
  "company_profile:write": "Complete company onboarding or update the existing company profile.",
  "engineer_profile:read": "Read the engineer profile linked to this account.",
  "engineer_profile:write": "Complete engineer onboarding or update the existing engineer profile.",
  "project:read": "Read projects owned by your company.",
  "project:write": "Create and update your company project drafts. Publishing remains web-only.",
} satisfies Record<OAuthScope, string>;

async function validateAuthorizeParams(params: AuthorizeParams) {
  if (params.response_type !== "code") return { ok: false as const, message: "Unsupported response_type." };
  if (!params.client_id) return { ok: false as const, message: "client_id is required." };
  if (!params.redirect_uri) return { ok: false as const, message: "redirect_uri is required." };
  if (!params.code_challenge) return { ok: false as const, message: "code_challenge is required." };
  if (params.code_challenge_method !== "S256") {
    return { ok: false as const, message: "Only S256 PKCE is supported." };
  }

  const client = await prisma.oAuthClient.findUnique({ where: { clientId: params.client_id } });
  if (!client) return { ok: false as const, message: "Unknown client." };
  if (!client.redirectUris.includes(params.redirect_uri)) {
    return { ok: false as const, message: "redirect_uri is not registered for this client." };
  }

  const scopes = normalizeScopes(params.scope, ["company_profile:read"]);
  if (!scopes) return { ok: false as const, message: "Unsupported scope." };

  const clientScopes = normalizeScopes(client.scope, [...OAUTH_SCOPES]);
  if (!clientScopes || scopes.some((scope) => !clientScopes.includes(scope))) {
    return { ok: false as const, message: "Requested scope is not registered for this client." };
  }

  return { ok: true as const, client, scopes };
}

function AuthorizeError({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-black text-slate-900">FlowLink MCP connection failed</h1>
      <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {message}
      </p>
    </main>
  );
}
