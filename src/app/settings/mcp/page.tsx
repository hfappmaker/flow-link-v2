import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Bot, CheckCircle2, Clock3, ExternalLink, KeyRound, ShieldCheck } from "lucide-react";
import { DisconnectMcpClientForm } from "@/components/mcp/disconnect-mcp-client-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import { normalizeScopes, OAUTH_SCOPES, type OAuthScope } from "@/lib/mcp-oauth";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "MCP連携",
  description: "FlowLinkに接続したMCPクライアントと許可scopeを管理します。",
};

const scopeLabels: Record<OAuthScope, string> = {
  "company_profile:read": "企業プロフィールの読み取り",
  "company_profile:write": "企業プロフィールの登録・更新",
  "engineer_profile:read": "エンジニアプロフィールの読み取り",
  "engineer_profile:write": "エンジニアプロフィールの登録・更新",
  "project:read": "自社案件の一覧取得",
  "project:write": "自社案件下書きの作成・更新",
};

type TokenRow = {
  clientId: string;
  scope: string;
  expiresAt: Date;
  lastUsedAt: Date | null;
  createdAt: Date;
  tokenKind: "access" | "refresh";
};

type ClientConnection = {
  clientId: string;
  clientName: string;
  clientUri: string | null;
  redirectUris: string[];
  scopes: OAuthScope[];
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt: Date | null;
  latestToolName: string | null;
  latestOutcome: string | null;
  latestAuditAt: Date | null;
  hasRefreshToken: boolean;
};

export default async function McpSettingsPage() {
  const user = await requireUser();
  const now = new Date();

  const [accessTokens, refreshTokens] = await Promise.all([
    prisma.oAuthAccessToken.findMany({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      select: {
        clientId: true,
        scope: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    }),
    prisma.oAuthRefreshToken.findMany({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      select: {
        clientId: true,
        scope: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    }),
  ]);

  const tokenRows: TokenRow[] = [
    ...accessTokens.map((token) => ({ ...token, tokenKind: "access" as const })),
    ...refreshTokens.map((token) => ({ ...token, tokenKind: "refresh" as const })),
  ];
  const clientIds = [...new Set(tokenRows.map((token) => token.clientId))];

  const [clients, auditLogs] =
    clientIds.length > 0
      ? await Promise.all([
          prisma.oAuthClient.findMany({
            where: { clientId: { in: clientIds } },
            select: {
              clientId: true,
              clientName: true,
              clientUri: true,
              redirectUris: true,
            },
          }),
          prisma.mcpAuditLog.findMany({
            where: {
              userId: user.id,
              clientId: { in: clientIds },
            },
            orderBy: { createdAt: "desc" },
            select: {
              clientId: true,
              toolName: true,
              outcome: true,
              createdAt: true,
            },
          }),
        ])
      : [[], []];

  const connections = buildConnections({ tokenRows, clients, auditLogs });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            <Bot className="h-4 w-4" />
            MCP
          </p>
          <h1 className="mt-3 text-2xl font-black text-slate-900">MCP連携</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
            FlowLinkに接続したMCPクライアント、許可したscope、最終利用日時を確認できます。
            不要になった連携はここから解除してください。
          </p>
        </div>
        <Link href="/mcp" className={buttonClasses("outline", "sm")}>
          接続方法を見る
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="接続中" value={`${connections.length}件`} icon={<ShieldCheck className="h-5 w-5" />} />
        <SummaryCard
          label="許可中scope"
          value={`${new Set(connections.flatMap((connection) => connection.scopes)).size}個`}
          icon={<KeyRound className="h-5 w-5" />}
        />
        <SummaryCard
          label="最終利用"
          value={formatDateTime(maxDate(connections.map((connection) => connection.lastUsedAt)))}
          icon={<Clock3 className="h-5 w-5" />}
        />
      </div>

      <section className="mt-6 space-y-4">
        {connections.length === 0 ? (
          <Card>
            <CardBody className="p-8 text-center">
              <Bot className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-4 text-lg font-bold text-slate-900">接続中のMCPクライアントはありません</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Claude、ChatGPT、CodexなどのMCPクライアントからFlowLinkを認証すると、ここに連携情報が表示されます。
              </p>
              <Link href="/mcp" className={buttonClasses("primary", "sm", "mt-5")}>
                MCP接続設定へ
              </Link>
            </CardBody>
          </Card>
        ) : (
          connections.map((connection) => (
            <Card key={connection.clientId}>
              <CardHeader
                title={
                  <div>
                    <p className="text-base font-black text-slate-900">{connection.clientName}</p>
                    <p className="mt-1 break-all text-xs font-normal text-slate-500">{connection.clientId}</p>
                  </div>
                }
                action={<DisconnectMcpClientForm clientId={connection.clientId} />}
                className="items-start gap-4"
              />
              <CardBody className="p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <InfoBlock label="連携開始" value={formatDateTime(connection.createdAt)} />
                  <InfoBlock label="最終利用" value={formatDateTime(connection.lastUsedAt)} />
                  <InfoBlock
                    label={connection.hasRefreshToken ? "再認証目安" : "アクセストークン期限"}
                    value={formatDateTime(connection.expiresAt)}
                  />
                </div>

                <div className="mt-5">
                  <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">許可したscope</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {connection.scopes.map((scope) => (
                      <span
                        key={scope}
                        className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-800"
                        title={scopeLabels[scope]}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {scope}
                      </span>
                    ))}
                  </div>
                  <ul className="mt-3 space-y-1 text-xs leading-relaxed text-slate-500">
                    {connection.scopes.map((scope) => (
                      <li key={scope}>
                        <span className="font-semibold text-slate-700">{scope}</span>: {scopeLabels[scope]}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <InfoBlock
                    label="直近のMCP利用"
                    value={
                      connection.latestToolName
                        ? `${connection.latestToolName} / ${connection.latestOutcome ?? "unknown"}`
                        : "まだ利用記録がありません"
                    }
                    subValue={formatDateTime(connection.latestAuditAt)}
                  />
                  <InfoBlock
                    label="リダイレクトURI"
                    value={connection.redirectUris[0] ?? "未登録"}
                    subValue={connection.redirectUris.length > 1 ? `ほか${connection.redirectUris.length - 1}件` : null}
                  />
                </div>

                {connection.clientUri ? (
                  <Link
                    href={connection.clientUri}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    クライアント情報を開く
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </CardBody>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}

function buildConnections({
  tokenRows,
  clients,
  auditLogs,
}: {
  tokenRows: TokenRow[];
  clients: Array<{
    clientId: string;
    clientName: string | null;
    clientUri: string | null;
    redirectUris: string[];
  }>;
  auditLogs: Array<{
    clientId: string | null;
    toolName: string;
    outcome: string;
    createdAt: Date;
  }>;
}) {
  const clientById = new Map(clients.map((client) => [client.clientId, client]));
  const latestAuditByClient = new Map<string, (typeof auditLogs)[number]>();
  for (const auditLog of auditLogs) {
    if (!auditLog.clientId || latestAuditByClient.has(auditLog.clientId)) continue;
    latestAuditByClient.set(auditLog.clientId, auditLog);
  }

  const grouped = new Map<string, ClientConnection>();
  for (const token of tokenRows) {
    const client = clientById.get(token.clientId);
    const existing = grouped.get(token.clientId);
    const scopes = normalizeScopes(token.scope, []) ?? [];
    const auditLog = latestAuditByClient.get(token.clientId);

    if (!existing) {
      grouped.set(token.clientId, {
        clientId: token.clientId,
        clientName: client?.clientName || "MCPクライアント",
        clientUri: client?.clientUri ?? null,
        redirectUris: client?.redirectUris ?? [],
        scopes,
        createdAt: token.createdAt,
        expiresAt: token.expiresAt,
        lastUsedAt: token.lastUsedAt,
        latestToolName: auditLog?.toolName ?? null,
        latestOutcome: auditLog?.outcome ?? null,
        latestAuditAt: auditLog?.createdAt ?? null,
        hasRefreshToken: token.tokenKind === "refresh",
      });
      continue;
    }

    existing.scopes = sortScopes([...new Set([...existing.scopes, ...scopes])]);
    existing.createdAt = minDate([existing.createdAt, token.createdAt]) ?? existing.createdAt;
    existing.expiresAt = maxDate([existing.expiresAt, token.expiresAt]) ?? existing.expiresAt;
    existing.lastUsedAt = maxDate([existing.lastUsedAt, token.lastUsedAt]);
    existing.hasRefreshToken = existing.hasRefreshToken || token.tokenKind === "refresh";
  }

  return [...grouped.values()].sort((a, b) => {
    const aTime = a.lastUsedAt?.getTime() ?? a.createdAt.getTime();
    const bTime = b.lastUsedAt?.getTime() ?? b.createdAt.getTime();
    return bTime - aTime;
  });
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">{label}</p>
          <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}

function InfoBlock({ label, value, subValue }: { label: string; value: string; subValue?: string | null }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">{label}</p>
      <p className="mt-1 break-all text-sm font-semibold text-slate-800">{value}</p>
      {subValue ? <p className="mt-1 break-all text-xs text-slate-500">{subValue}</p> : null}
    </div>
  );
}

function sortScopes(scopes: OAuthScope[]) {
  return scopes.sort((a, b) => OAUTH_SCOPES.indexOf(a) - OAUTH_SCOPES.indexOf(b));
}

function formatDateTime(date: Date | null | undefined) {
  if (!date) return "未使用";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function maxDate(dates: Array<Date | null | undefined>) {
  const values = dates.filter((date): date is Date => Boolean(date));
  if (values.length === 0) return null;
  return new Date(Math.max(...values.map((date) => date.getTime())));
}

function minDate(dates: Array<Date | null | undefined>) {
  const values = dates.filter((date): date is Date => Boolean(date));
  if (values.length === 0) return null;
  return new Date(Math.min(...values.map((date) => date.getTime())));
}
