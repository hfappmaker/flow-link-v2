import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { normalizeScopes, OAUTH_SCOPES } from "@/lib/mcp-oauth";
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
  const needsProjectScope = validation.scopes.some((scope) => scope.startsWith("project:"));
  if (needsProjectScope && !membership) {
    return <AuthorizeError message="Project MCP tools can only be connected by a company account." />;
  }

  const clientName = validation.client.clientName ?? "MCP client";
  const accountName = membership?.company.name ?? engineerProfile?.displayName ?? session.user.email ?? "your account";
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-black text-slate-900">FlowLink MCP connection</h1>
      <p className="mt-2 text-sm text-slate-600">
        {clientName} is requesting access to {accountName}.
      </p>

      <Card className="mt-6">
        <CardBody className="space-y-5 p-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Allowed</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              {validation.scopes.includes("project:read") ? <li>View your company projects.</li> : null}
              {validation.scopes.includes("project:write") ? (
                <li>Create and update your company project drafts.</li>
              ) : null}
              {validation.scopes.includes("company_profile:read") ? <li>View your company profile.</li> : null}
              {validation.scopes.includes("company_profile:write") ? (
                <li>Register and update your company profile.</li>
              ) : null}
              {validation.scopes.includes("engineer_profile:read") ? <li>View your engineer profile.</li> : null}
              {validation.scopes.includes("engineer_profile:write") ? (
                <li>Register and update your engineer profile.</li>
              ) : null}
              {validation.scopes.some((scope) => scope.startsWith("project:")) ? (
                <li>Project publishing is not available from MCP.</li>
              ) : null}
            </ul>
          </div>

          <form method="post" action="/oauth/authorize/confirm" className="flex items-center gap-3">
            {Object.entries(params).map(([key, value]) =>
              value ? <input key={key} type="hidden" name={key} value={value} /> : null,
            )}
            <Button type="submit">Allow</Button>
            <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-900">
              Cancel
            </Link>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}

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
