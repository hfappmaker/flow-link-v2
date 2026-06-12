# FlowLink

フリーランスエンジニアと企業をつなぐマッチングプラットフォーム。
Findy Freelance / レバテックを参考に、案件検索・応募・スカウト・チャットまでをワンストップで提供します。

## 主な機能

### フリーランスエンジニア向け
- **案件検索** — フリーワード / 職種 / 開発言語 / スキル / 単価 / 稼働日数 / リモート頻度 / こだわり条件で絞り込み。新着順・単価順・人気順ソート対応
- **案件詳細** — 参画メリット、単価目安（月額＋時給換算）、必須・歓迎要件、募集背景などFindy風の構成
- **応募** — メッセージ付きで応募。応募と同時に企業とのチャットが開始
- **応募管理** — 選考ステータスの確認、辞退
- **案件の保存**（検討中リスト）
- **スカウト受信** — 企業からのスカウトに「興味あり / 辞退」で返答、チャットで直接やり取り
- **プロフィール** — スキル・希望単価・希望稼働日数・リモート希望・公開設定など

### 企業向け
- **採用ダッシュボード** — 公開案件数 / 新規応募 / スカウト返答状況 / 未読メッセージ
- **案件管理** — 案件の作成・編集・下書き保存・募集終了/再開
- **応募者管理** — 応募者の一覧、選考ステータス更新、チャット
- **エンジニア検索** — スキル / 職種 / 稼働日数 / リモート希望で検索
- **スカウト送信** — 案件を紐付けてスカウト。送信と同時にチャット開始
- **スカウト管理** — 返答状況の確認

### 共通
- **チャット** — 応募・スカウト単位の1対1チャット（4秒ポーリング、未読バッジ、既読管理）
- **認証** — Google / GitHub / Microsoftアカウント / メールアドレス＆パスワード

## 技術スタック

| 領域 | 技術 |
| --- | --- |
| フレームワーク | Next.js 15 (App Router) / React 19 / TypeScript |
| スタイリング | Tailwind CSS v4 |
| DB / ORM | PostgreSQL (Prisma Postgres) / Prisma 6 |
| 認証 | Auth.js (NextAuth v5) + Prisma Adapter (JWTセッション) |
| デプロイ | Vercel |

## ローカル開発

### 1. 依存関係のインストール

```bash
npm install
```

### 2. データベースの用意

Docker を使う場合:

```bash
docker run -d --name flowlink-pg \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=flowlink \
  -p 5432:5432 postgres:16-alpine
```

> Node.js 22.5+ を使っている場合は `npx prisma dev` でローカルPrisma Postgresも利用できます。

### 3. 環境変数

`.env.example` をコピーして `.env` を作成し、値を設定します。
最低限 `DATABASE_URL` と `AUTH_SECRET`（`npx auth secret` で生成可）があれば、メール＆パスワードログインで動作します。
OAuth（Google / GitHub / Microsoft）は設定したプロバイダのボタンだけが自動的に表示されます。

### 4. スキーマ反映とシード投入

```bash
npm run db:push   # スキーマをDBへ反映
npm run db:seed   # デモデータ投入（既存データは削除されます）
```

### 5. 起動

```bash
npm run dev
```

http://localhost:3000 で起動します。

### デモアカウント（シード投入後）

| 役割 | メールアドレス | パスワード |
| --- | --- | --- |
| エンジニア | engineer@example.com | password123 |
| エンジニア（スカウト受信済み） | sato@example.com | password123 |
| 企業（株式会社テックフロー） | company@example.com | password123 |
| 企業（AIワークス株式会社） | company2@example.com | password123 |

## Vercel へのデプロイ

1. このリポジトリを GitHub に push
2. Vercel で New Project → リポジトリをインポート（Framework: Next.js、設定はデフォルトでOK）
3. **Storage → Marketplace → Prisma Postgres** を追加（`DATABASE_URL` が自動で設定されます）
4. 環境変数を設定（下記「人間がやるべき作業」参照）
5. デプロイ後、ローカルから本番DBへスキーマ反映とシード投入:

```bash
# Vercelの環境変数からDATABASE_URLを取得して実行
npx vercel env pull .env.production.local
npx dotenv -e .env.production.local -- npx prisma db push
npx dotenv -e .env.production.local -- npx prisma db seed   # 任意
```

（`package.json` の `postinstall` で `prisma generate` が実行されるため、ビルド設定の変更は不要です）

## 人間がやるべき作業（チェックリスト）

コードでは自動化できない、サービス側での設定作業の一覧です。

### 必須

- [ ] **GitHub リポジトリ作成 & push** — Vercel連携のため
- [ ] **Vercel プロジェクト作成** — リポジトリをインポート
- [ ] **Prisma Postgres 作成** — Vercel Marketplace（Storage タブ）から追加。`DATABASE_URL` が自動設定される
- [ ] **AUTH_SECRET の設定** — `npx auth secret` で生成し、Vercelの環境変数に設定
- [ ] **本番DBへのスキーマ反映** — `prisma db push`（または `prisma migrate deploy`）

### OAuthログインを有効にする場合（プロバイダごとに任意）

設定しなかったプロバイダのボタンは表示されません（メール＆パスワードは常に利用可）。
コールバックURLの `{ORIGIN}` は `https://<your-app>.vercel.app` とローカル開発用の `http://localhost:3000` の両方を登録してください。

- [ ] **Google** — [Google Cloud Console](https://console.cloud.google.com/apis/credentials) で OAuth クライアントID作成
  - コールバックURL: `{ORIGIN}/api/auth/callback/google`
  - 環境変数: `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- [ ] **GitHub** — [Developer settings](https://github.com/settings/developers) で OAuth App 作成
  - コールバックURL: `{ORIGIN}/api/auth/callback/github`
  - 環境変数: `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`
- [ ] **Microsoft** — [Azure Portal](https://portal.azure.com) → Microsoft Entra ID → アプリの登録
  - サポートされるアカウントの種類: 「個人用 Microsoft アカウントを含む」を推奨
  - リダイレクトURI(Web): `{ORIGIN}/api/auth/callback/microsoft-entra-id`
  - 証明書とシークレットでクライアントシークレットを発行
  - 環境変数: `AUTH_MICROSOFT_ENTRA_ID_ID` / `AUTH_MICROSOFT_ENTRA_ID_SECRET` / `AUTH_MICROSOFT_ENTRA_ID_ISSUER`（個人アカウント許可なら `https://login.microsoftonline.com/common/v2.0` のまま）

### 運用開始前に検討すべきこと

- [ ] **独自ドメインの設定**（Vercel → Domains）。設定後はOAuth各社のコールバックURLにも追加
- [ ] **メール送信の導入** — 現状パスワードリセット・メール認証は未実装。Resend等の導入を推奨
- [ ] **利用規約・プライバシーポリシーの作成**（フッターへのリンク追加）
- [ ] **チャットのリアルタイム化** — 現在は4秒ポーリング。規模拡大時は Pusher / Ably 等への移行を検討
- [ ] **画像アップロード** — アバター・企業ロゴは現状OAuthのプロフィール画像のみ。Vercel Blob等の導入を検討
- [ ] **シードデータの削除** — 本番公開時はデモアカウントを削除（`prisma db seed` を本番で実行しない）

## スクリプト

| コマンド | 説明 |
| --- | --- |
| `npm run dev` | 開発サーバー起動（Turbopack） |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバー起動 |
| `npm run db:push` | Prismaスキーマを DB へ反映 |
| `npm run db:seed` | シードデータ投入（全データリセット） |
| `npm run db:migrate` | マイグレーション作成・適用（開発） |
| `npm run db:studio` | Prisma Studio（DB GUI）起動 |

## ディレクトリ構成（抜粋)

```
prisma/
  schema.prisma        # データモデル（User/EngineerProfile/Company/Project/Application/Scout/Conversation/Message）
  seed.ts              # デモデータ
src/
  auth.ts              # Auth.js設定（Google/GitHub/Microsoft/Credentials）
  lib/
    actions/           # サーバーアクション（応募・スカウト・案件・プロフィール等）
    project-search.ts  # 案件検索のクエリ構築
    session.ts         # 認証ガード（requireEngineer / requireCompany）
  app/
    projects/          # 案件検索・詳細・応募（公開）
    dashboard/ applications/ saved/ scouts/ settings/   # エンジニア向け
    company/           # 企業向け（ダッシュボード・案件管理・エンジニア検索・スカウト）
    messages/          # チャット（共通）
    api/               # 認証・登録・チャットAPI
```
