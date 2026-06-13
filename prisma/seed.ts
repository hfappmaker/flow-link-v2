import { PrismaClient, SkillCategory, RemoteType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SKILLS: Array<[string, SkillCategory]> = [
  ["TypeScript", "LANGUAGE"],
  ["JavaScript", "LANGUAGE"],
  ["Python", "LANGUAGE"],
  ["Go", "LANGUAGE"],
  ["Java", "LANGUAGE"],
  ["Kotlin", "LANGUAGE"],
  ["Swift", "LANGUAGE"],
  ["Ruby", "LANGUAGE"],
  ["PHP", "LANGUAGE"],
  ["C#", "LANGUAGE"],
  ["Rust", "LANGUAGE"],
  ["React", "FRAMEWORK"],
  ["Next.js", "FRAMEWORK"],
  ["Vue.js", "FRAMEWORK"],
  ["Nuxt", "FRAMEWORK"],
  ["Angular", "FRAMEWORK"],
  ["Svelte", "FRAMEWORK"],
  ["Node.js", "FRAMEWORK"],
  ["NestJS", "FRAMEWORK"],
  ["Django", "FRAMEWORK"],
  ["FastAPI", "FRAMEWORK"],
  ["Ruby on Rails", "FRAMEWORK"],
  ["Laravel", "FRAMEWORK"],
  ["Spring Boot", "FRAMEWORK"],
  ["Flutter", "FRAMEWORK"],
  ["React Native", "FRAMEWORK"],
  ["AWS", "INFRA"],
  ["Google Cloud", "INFRA"],
  ["Azure", "INFRA"],
  ["Docker", "INFRA"],
  ["Kubernetes", "INFRA"],
  ["Terraform", "INFRA"],
  ["PostgreSQL", "DATABASE"],
  ["MySQL", "DATABASE"],
  ["MongoDB", "DATABASE"],
  ["Redis", "DATABASE"],
  ["BigQuery", "DATABASE"],
  ["GraphQL", "TOOL"],
  ["Figma", "TOOL"],
  ["Unity", "TOOL"],
  ["機械学習", "OTHER"],
  ["LLM・生成AI", "OTHER"],
  ["データ分析", "OTHER"],
];

async function main() {
  console.log("🌱 シードデータを投入します...");

  // 依存順に全削除（デモ用のリセット）
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.scout.deleteMany();
  await prisma.application.deleteMany();
  await prisma.savedProject.deleteMany();
  await prisma.projectSkill.deleteMany();
  await prisma.project.deleteMany();
  await prisma.engineerSkill.deleteMany();
  await prisma.workHistory.deleteMany();
  await prisma.engineerProfile.deleteMany();
  await prisma.companyMember.deleteMany();
  await prisma.company.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // ---- スキル ----
  const skills = new Map<string, string>();
  for (const [name, category] of SKILLS) {
    const s = await prisma.skill.create({ data: { name, category } });
    skills.set(name, s.id);
  }
  const skillIds = (names: string[]) =>
    names.map((n) => {
      const id = skills.get(n);
      if (!id) throw new Error(`Unknown skill: ${n}`);
      return { skillId: id };
    });

  const passwordHash = await bcrypt.hash("password123", 10);
  const emailVerified = new Date();

  // ---- 企業 ----
  const techflow = await prisma.company.create({
    data: {
      name: "株式会社テックフロー",
      industry: "ITサービス系",
      location: "東京都渋谷区",
      website: "https://techflow.example.com",
      description:
        "BtoB SaaSの受託開発・自社プロダクト開発を行うテック企業です。少数精鋭のチームで、モダンな技術スタックを積極的に採用しています。",
    },
  });
  const aiwork = await prisma.company.create({
    data: {
      name: "AIワークス株式会社",
      industry: "AI・機械学習",
      location: "東京都港区",
      website: "https://aiworks.example.com",
      description:
        "情報検索・レコメンデーション技術を強みに、企業の機械学習活用・データ活用を支援するソリューション事業を展開しています。",
    },
  });
  const finbase = await prisma.company.create({
    data: {
      name: "フィンベース株式会社",
      industry: "FinTech",
      location: "大阪府大阪市",
      website: "https://finbase.example.com",
      description:
        "次世代金融システムの開発を手がけるFinTechスタートアップです。フルリモート・フレックスで全国のエンジニアと協働しています。",
    },
  });

  const companyUser = await prisma.user.create({
    data: {
      name: "採用担当 鈴木",
      email: "company@example.com",
      emailVerified,
      passwordHash,
      role: "COMPANY",
      companyMember: { create: { companyId: techflow.id } },
    },
  });
  await prisma.user.create({
    data: {
      name: "採用担当 佐藤",
      email: "company2@example.com",
      emailVerified,
      passwordHash,
      role: "COMPANY",
      companyMember: { create: { companyId: aiwork.id } },
    },
  });

  // ---- エンジニア ----
  const engineerUser = await prisma.user.create({
    data: {
      name: "山田 太郎",
      email: "engineer@example.com",
      emailVerified,
      passwordHash,
      role: "ENGINEER",
      engineerProfile: {
        create: {
          displayName: "山田 太郎",
          title: "フルスタックエンジニア",
          bio: "Web系の受託・自社開発で10年の経験があります。直近3年はTypeScript/Next.js/NestJSでのSaaS開発がメインで、要件定義から設計・実装・運用まで一貫して担当してきました。少人数チームでの0→1開発が得意です。",
          location: "東京都",
          yearsOfExperience: 10,
          desiredRateMin: 800000,
          desiredRateMax: 1200000,
          desiredWeeklyDays: 4,
          remotePreference: "FULL_REMOTE",
          workStatus: "AVAILABLE",
          githubUrl: "https://github.com/example",
          skills: {
            create: skillIds(["TypeScript", "JavaScript", "React", "Next.js", "NestJS", "Node.js", "AWS", "PostgreSQL"]),
          },
          workHistories: {
            create: [
              {
                projectName: "BtoB SaaSの新規開発（不動産テック）",
                role: "テックリード",
                description: "MVP開発を技術選定からリード。Next.js + NestJS + AWSで設計・実装。",
                techStack: "TypeScript, Next.js, NestJS, AWS, PostgreSQL",
                startYearMonth: "2024-04",
                endYearMonth: "2025-12",
              },
              {
                projectName: "ECサイトのリプレイス",
                role: "バックエンドエンジニア",
                description: "レガシーPHPからNode.jsへの移行を担当。",
                techStack: "Node.js, MySQL, Docker",
                startYearMonth: "2022-01",
                endYearMonth: "2024-03",
              },
            ],
          },
        },
      },
    },
  });

  const moreEngineers = [
    {
      email: "sato@example.com",
      name: "佐藤 花子",
      title: "機械学習エンジニア",
      bio: "画像系の機械学習プロジェクトを中心に7年の経験。類似画像検索・レコメンデーションのPoCから本番運用まで担当してきました。",
      location: "神奈川県",
      years: 7,
      rateMin: 700000,
      rateMax: 1000000,
      days: 3,
      remote: "FULL_REMOTE" as RemoteType,
      skills: ["Python", "機械学習", "LLM・生成AI", "FastAPI", "Google Cloud", "BigQuery"],
    },
    {
      email: "tanaka@example.com",
      name: "田中 健",
      title: "フロントエンドエンジニア",
      bio: "デザインシステム構築とアクセシビリティが得意なフロントエンドエンジニアです。React/Next.jsでのBtoC開発経験が豊富です。",
      location: "東京都",
      years: 6,
      rateMin: 600000,
      rateMax: 900000,
      days: 5,
      remote: "REMOTE_MAIN" as RemoteType,
      skills: ["TypeScript", "React", "Next.js", "Svelte", "Figma", "GraphQL"],
    },
    {
      email: "suzuki@example.com",
      name: "鈴木 一郎",
      title: "インフラエンジニア",
      bio: "AWS/Terraformを用いたIaC・SRE業務が専門です。スタートアップから大規模サービスまでのインフラ構築・運用経験があります。",
      location: "福岡県",
      years: 9,
      rateMin: 750000,
      rateMax: 1100000,
      days: 4,
      remote: "FULL_REMOTE" as RemoteType,
      skills: ["AWS", "Terraform", "Kubernetes", "Docker", "Go", "PostgreSQL"],
    },
  ];
  for (const e of moreEngineers) {
    await prisma.user.create({
      data: {
        name: e.name,
        email: e.email,
        emailVerified,
        passwordHash,
        role: "ENGINEER",
        engineerProfile: {
          create: {
            displayName: e.name,
            title: e.title,
            bio: e.bio,
            location: e.location,
            yearsOfExperience: e.years,
            desiredRateMin: e.rateMin,
            desiredRateMax: e.rateMax,
            desiredWeeklyDays: e.days,
            remotePreference: e.remote,
            workStatus: "OPEN_TO_OFFERS",
            skills: { create: skillIds(e.skills) },
          },
        },
      },
    });
  }

  // ---- 案件 ----
  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

  const projects: Array<{
    companyId: string;
    title: string;
    summary: string;
    jobCategory: string;
    rateMin?: number;
    rateMax: number;
    weeklyDaysMin: number;
    weeklyDaysMax: number;
    remoteType: RemoteType;
    location?: string;
    industry?: string;
    features: string[];
    merits: string;
    background?: string;
    description: string;
    required: string;
    preferred: string;
    ideal?: string;
    devEnv?: string;
    skills: string[];
    publishedAt: Date;
    viewCount: number;
  }> = [
    {
      companyId: techflow.id,
      title: "【週3-5日/フルリモート/TypeScript,Next.js】フルスタックエンジニア - AIを活用した不動産テックSaaSのMVP開発をリード",
      summary:
        "不動産会社の企画業務を支援するBtoB向け新規プロダクトの開発。データ分析やAIを活用し、情報収集から意思決定までを支援します。年内のβ提供に向けたMVP開発フェーズで、裁量の大きいポジションです。",
      jobCategory: "フルスタックエンジニア",
      rateMax: 1200000,
      weeklyDaysMin: 3,
      weeklyDaysMax: 5,
      remoteType: "FULL_REMOTE",
      location: "渋谷（東京都）",
      industry: "AI・不動産テック",
      features: ["BtoB", "新規サービス開発", "新技術に積極的", "面談1回", "生成AI活用企業"],
      merits:
        "AI/LLMを活用した新規BtoBプロダクトの0→1開発に携わることができます\n技術選定やアーキテクチャ設計の初期段階から関与し、技術的な意思決定をリードできます\n少人数チームのため、幅広い役割を担い裁量を持って開発を推進できます",
      background:
        "年内のβ提供に向けたMVP開発フェーズです。AIを活用した機能を含むため、技術検証と仕様設計を並行して進めており、要件定義から実装までを一貫して担えるフルスタックエンジニアを募集します。",
      description:
        "・要件整理・開発推進・技術論点整理・β提供に向けた推進全般\n・Next.js/FastAPIを用いたWebアプリケーションの設計・実装\n・LLMを活用した機能のプロトタイピングと本実装\n・エンジニア・デザイナーと連携したスクラム開発",
      required:
        "TypeScriptを用いたWebアプリケーション開発経験3年以上\n要件定義から実装まで一人で進められる方\nPythonまたはNode.jsでのAPI開発経験",
      preferred:
        "LLM/生成AIを活用したプロダクト開発経験\nMVPフェーズ・0→1開発の経験\nテックリードやPM的な動きの経験",
      ideal:
        "役割を限定しすぎず、PM的な動きも実装も横断して実動できる方\nスピードを重視し、完璧さより「まず動くものを作って磨く」進め方ができる方",
      devEnv: "開発手法: AI駆動開発\nAIツール: Cursor等のAI開発ツールの利用を前提としています",
      skills: ["TypeScript", "Next.js", "Python", "FastAPI", "AWS"],
      publishedAt: daysAgo(1),
      viewCount: 320,
    },
    {
      companyId: aiwork.id,
      title: "【週2-4日/フルリモート/Python】機械学習エンジニア - 類似画像検索システムの精度改善プロジェクト",
      summary:
        "情報検索やレコメンデーションの技術を中心に、企業の機械学習活用を支援するソリューション事業です。受託案件における類似画像検索の精度改善をご担当いただきます。",
      jobCategory: "機械学習エンジニア",
      rateMax: 960000,
      weeklyDaysMin: 2,
      weeklyDaysMax: 4,
      remoteType: "FULL_REMOTE",
      industry: "ITサービス系",
      features: ["BtoB", "週3日以下可", "土日祝日休み"],
      merits:
        "類似画像検索という専門性の高い領域で精度改善の経験を積むことができます\n情報検索・レコメンデーション技術に強みを持つ環境で実践的なスキルを高められます\nクライアント企業の課題解決に直接貢献できます",
      background:
        "新規に類似画像検索システムの精度改善に関する受託案件が発生したため、画像系の機械学習のご経験がある方を募集しています。",
      description:
        "・類似画像検索システムの精度改善\n・Pythonを用いた機械学習モデルの改善・開発\n・機械学習アプリケーション（API、バッチシステム）の開発・実装",
      required:
        "Pythonを用いた機械学習プロジェクトのPoC経験\n機械学習アプリケーション（APIやバッチシステム）の開発経験\n画像系の機械学習プロジェクトのご経験",
      preferred: "クライアントとの折衝や要件定義の経験\n類似画像検索の精度改善プロジェクトのご経験",
      ideal: "適切にコミュニケーションを取り、迅速にアウトプットを出せる方",
      skills: ["Python", "機械学習", "FastAPI", "Google Cloud"],
      publishedAt: daysAgo(2),
      viewCount: 410,
    },
    {
      companyId: aiwork.id,
      title: "【週5日/リモートメイン/Python】AI・LLMエンジニア - 大手通信キャリア向けLLMアプリケーション開発支援",
      summary:
        "大手通信キャリアのサービス開発において、LLMを活用したアプリケーション開発を支援いただきます。RAGやエージェント連携を含む実践的なLLM活用案件です。",
      jobCategory: "AI・LLMエンジニア",
      rateMax: 768000,
      weeklyDaysMin: 5,
      weeklyDaysMax: 5,
      remoteType: "REMOTE_MAIN",
      location: "品川（東京都）",
      industry: "通信",
      features: ["BtoB", "長期案件", "新技術に積極的", "生成AI活用企業", "土日祝日休み"],
      merits:
        "大手通信キャリアのサービス開発においてAI活用を推進する貴重な経験を積むことができます\nLLMアプリケーション開発の実践的なノウハウが身につきます",
      background:
        "生成AIを活用した新機能開発が加速しており、LLMアプリケーションの開発経験を持つエンジニアを増員します。",
      description:
        "・LLMを活用したアプリケーションの設計・開発\n・RAGパイプラインの構築・改善\n・プロンプト設計と评価基盤の整備\n・社内エンジニアへの技術支援",
      required:
        "Pythonでの開発経験3年以上\nLLM API（OpenAI互換API等）を用いた開発経験\nWeb APIの設計・開発経験",
      preferred: "RAG・AIエージェントの実装経験\nLangChain等のフレームワーク利用経験\nMLOpsの知見",
      skills: ["Python", "LLM・生成AI", "FastAPI", "AWS", "Docker"],
      publishedAt: daysAgo(0),
      viewCount: 150,
    },
    {
      companyId: finbase.id,
      title: "【週4日/フルリモート/Go,TypeScript】バックエンドエンジニア - 次世代金融システムの事業開発案件",
      summary:
        "次世代金融システムのバックエンド開発。マイクロサービスアーキテクチャでの大規模システム開発に携わっていただきます。",
      jobCategory: "バックエンドエンジニア",
      rateMax: 1100000,
      weeklyDaysMin: 4,
      weeklyDaysMax: 5,
      remoteType: "FULL_REMOTE",
      location: "六本木（東京都）",
      industry: "FinTech",
      features: ["BtoB", "長期案件", "自社サービス", "土日祝日休み", "新技術に積極的"],
      merits:
        "金融ドメインの大規模システム開発経験が積めます\nGoによるマイクロサービス設計・開発のスキルを磨けます\nフルリモートで全国どこからでも参画可能です",
      background:
        "事業拡大に伴い決済基盤の刷新プロジェクトが始動。コアサービスの設計・開発を担えるバックエンドエンジニアを募集します。",
      description:
        "・Goを用いたマイクロサービスの設計・開発\n・決済処理・残高管理など金融コアロジックの実装\n・gRPC/GraphQL APIの設計\n・テスト戦略の策定と品質改善",
      required:
        "GoまたはJavaでのバックエンド開発経験3年以上\nRDBを用いたトランザクション設計の知見\nチーム開発でのコードレビュー経験",
      preferred: "金融・決済システムの開発経験\nKubernetes環境での運用経験\nイベント駆動アーキテクチャの知見",
      skills: ["Go", "TypeScript", "Kubernetes", "PostgreSQL", "GraphQL"],
      publishedAt: daysAgo(4),
      viewCount: 280,
    },
    {
      companyId: techflow.id,
      title: "【週3日/フルリモート/React,Next.js】フロントエンドエンジニア - 設計支援プロダクトのUI開発",
      summary:
        "建築設計を支援するBtoB SaaSのフロントエンド開発。デザインシステムの構築からコンポーネント実装までを担当いただきます。",
      jobCategory: "フロントエンドエンジニア",
      rateMax: 890000,
      weeklyDaysMin: 3,
      weeklyDaysMax: 4,
      remoteType: "FULL_REMOTE",
      location: "新宿（東京都）",
      industry: "建築・SaaS",
      features: ["BtoB", "自社サービス", "週3日以下可", "土日祝日休み"],
      merits:
        "デザインシステム構築を主導できるポジションです\nデザイナーと密に連携しながらUI/UXの改善に取り組めます\n週3日からの柔軟な稼働が可能です",
      description:
        "・React/Next.jsを用いたSPA開発\n・デザインシステム・共通コンポーネントの設計と実装\n・パフォーマンス改善・アクセシビリティ対応\n・Figmaを用いたデザイナーとの協業",
      required:
        "React/TypeScriptでの開発経験3年以上\nコンポーネント設計・状態管理の知見\nWebパフォーマンス最適化の経験",
      preferred: "デザインシステム構築経験\nアクセシビリティ対応の知見\nStorybook等を用いた開発経験",
      skills: ["TypeScript", "React", "Next.js", "Figma", "GraphQL"],
      publishedAt: daysAgo(6),
      viewCount: 350,
    },
    {
      companyId: finbase.id,
      title: "【週5日/一部リモート/Kotlin】モバイルエンジニア - 金融アプリのAndroid開発",
      summary:
        "個人向け資産管理アプリのAndroid開発。設計から実装・リリースまでを少人数チームで推進していただきます。",
      jobCategory: "モバイルエンジニア",
      rateMax: 850000,
      weeklyDaysMin: 5,
      weeklyDaysMax: 5,
      remoteType: "PARTIAL_REMOTE",
      location: "大阪（大阪府）",
      industry: "FinTech",
      features: ["BtoC", "自社サービス", "長期案件"],
      merits:
        "金融ドメインのBtoCアプリ開発経験が積めます\nJetpack Composeを用いたモダンなAndroid開発ができます",
      description:
        "・Kotlin/Jetpack ComposeによるAndroidアプリ開発\n・新機能の設計・実装・テスト\n・クラッシュ解析とパフォーマンス改善",
      required: "KotlinによるAndroidアプリ開発経験3年以上\nアプリのリリース・運用経験",
      preferred: "Jetpack Composeでの開発経験\n金融系アプリの開発経験\niOS開発の経験",
      skills: ["Kotlin", "Swift", "GraphQL"],
      publishedAt: daysAgo(9),
      viewCount: 120,
    },
    {
      companyId: techflow.id,
      title: "【週4-5日/フルリモート/AWS,Terraform】SRE - マルチテナントSaaSの信頼性向上",
      summary:
        "急成長中のSaaSプロダクトのSREポジション。IaC化の推進、可観測性の向上、コスト最適化をリードしていただきます。",
      jobCategory: "SRE",
      rateMin: 800000,
      rateMax: 1150000,
      weeklyDaysMin: 4,
      weeklyDaysMax: 5,
      remoteType: "FULL_REMOTE",
      industry: "SaaS",
      features: ["BtoB", "自社サービス", "長期案件", "新技術に積極的", "English OK"],
      merits:
        "SLO運用・可観測性基盤の設計を主導できます\nTerraformによるIaCを全面的に推進している環境です\n国内外のメンバーが在籍するグローバルなチームです",
      description:
        "・AWS環境のIaC化推進（Terraform）\n・監視・アラート・ダッシュボードの整備（Datadog）\n・CI/CDパイプラインの改善\n・障害対応プロセスの整備とポストモーテム文化の推進",
      required:
        "AWSでのインフラ構築・運用経験3年以上\nTerraform等のIaCツール利用経験\nコンテナ環境（ECS/Kubernetes）の運用経験",
      preferred: "SREとしてのSLO/SLI運用経験\nDatadog等のAPMツール活用経験\nセキュリティ対応の知見",
      skills: ["AWS", "Terraform", "Kubernetes", "Docker", "Go"],
      publishedAt: daysAgo(3),
      viewCount: 240,
    },
    {
      companyId: aiwork.id,
      title: "【週3日/フルリモート/Python】データエンジニア - 製造業向けデータ基盤構築支援",
      summary:
        "製造業クライアントのデータ活用を支援するデータ基盤構築案件。BigQueryを中心としたモダンデータスタックの設計・構築を担当いただきます。",
      jobCategory: "データエンジニア",
      rateMax: 900000,
      weeklyDaysMin: 3,
      weeklyDaysMax: 4,
      remoteType: "FULL_REMOTE",
      industry: "製造業・データ活用",
      features: ["BtoB", "週3日以下可", "土日祝日休み", "長期案件"],
      merits:
        "モダンデータスタックでの基盤構築経験が積めます\n上流のデータ戦略策定から関与できます",
      description:
        "・BigQueryを中心としたDWH設計・構築\n・dbtによるデータモデリング・パイプライン整備\n・データ品質管理の仕組みづくり",
      required:
        "SQLによるデータモデリング経験\nPythonでのETL/ELTパイプライン構築経験\nクラウドDWH（BigQuery/Snowflake等）の利用経験",
      preferred: "dbtの利用経験\n製造業データの取り扱い経験\nダッシュボード構築経験（Looker等）",
      skills: ["Python", "BigQuery", "Google Cloud", "データ分析"],
      publishedAt: daysAgo(12),
      viewCount: 90,
    },
    {
      companyId: finbase.id,
      title: "【週5日/出社メイン/Java,Spring Boot】バックエンドエンジニア - 基幹システムのモダナイズ",
      summary:
        "金融機関の基幹システムをマイクロサービスへ段階的に移行するプロジェクト。レガシーシステムのモダナイズ経験を積めます。",
      jobCategory: "バックエンドエンジニア",
      rateMax: 750000,
      weeklyDaysMin: 5,
      weeklyDaysMax: 5,
      remoteType: "ONSITE_MAIN",
      location: "名古屋（愛知県）",
      industry: "金融",
      features: ["BtoB", "長期案件", "土日祝日休み"],
      merits:
        "大規模システムの移行プロジェクトを経験できます\n長期安定稼働が見込める案件です",
      description:
        "・Java/Spring Bootによるマイクロサービスの実装\n・レガシーコードの解析と移行設計\n・単体・結合テストの実施",
      required: "Javaでの開発経験5年以上\nSpring Frameworkの利用経験\nRDBの設計・チューニング経験",
      preferred: "金融系システムの開発経験\nマイクロサービス移行の経験",
      skills: ["Java", "Spring Boot", "MySQL", "Docker"],
      publishedAt: daysAgo(15),
      viewCount: 60,
    },
    {
      companyId: techflow.id,
      title: "【週2-3日/フルリモート/PM】プロジェクトマネージャー - 受託開発案件の進行管理",
      summary:
        "複数の受託開発プロジェクトのマネジメントポジション。クライアント折衝からチームビルディングまでお任せします。",
      jobCategory: "プロジェクトマネージャー",
      rateMax: 800000,
      weeklyDaysMin: 2,
      weeklyDaysMax: 3,
      remoteType: "FULL_REMOTE",
      industry: "ITサービス系",
      features: ["BtoB", "週3日以下可", "面談1回"],
      merits:
        "週2日からの柔軟な稼働が可能です\n複数プロジェクトを横断するマネジメント経験が積めます",
      description:
        "・受託開発プロジェクトの進行管理（2〜3案件並行）\n・クライアントとの要件調整・折衝\n・開発チームのタスク管理とリスク管理",
      required:
        "Web系開発プロジェクトのPM経験3年以上\nエンジニアバックグラウンドがある方\nクライアント折衝の経験",
      preferred: "アジャイル開発でのスクラムマスター経験\n受託開発会社での勤務経験",
      skills: ["TypeScript", "Python"],
      publishedAt: daysAgo(7),
      viewCount: 170,
    },
    {
      companyId: aiwork.id,
      title: "【週4日/リモートメイン/データサイエンティスト】需要予測モデルの構築・運用",
      summary:
        "小売業クライアント向けの需要予測モデル構築案件。データ分析からモデルの本番運用までを担当いただきます。",
      jobCategory: "データサイエンティスト",
      rateMax: 1000000,
      weeklyDaysMin: 4,
      weeklyDaysMax: 5,
      remoteType: "REMOTE_MAIN",
      location: "本郷三丁目（東京都）",
      industry: "小売・データ活用",
      features: ["BtoB", "長期案件", "新技術に積極的", "土日祝日休み"],
      merits:
        "ビジネスインパクトの大きい需要予測領域で経験を積めます\nMLOpsを含む本番運用まで一気通貫で関われます",
      description:
        "・需要予測モデルの構築・精度改善\n・特徴量設計とデータパイプラインの整備\n・予測結果のビジネス活用支援・レポーティング",
      required:
        "機械学習モデルの構築・運用経験3年以上\nPython/SQLでのデータ分析経験\n統計的なモデリングの知見",
      preferred: "需要予測・時系列分析の経験\nMLOps基盤の構築経験\n小売業界の知見",
      skills: ["Python", "機械学習", "BigQuery", "データ分析"],
      publishedAt: daysAgo(5),
      viewCount: 200,
    },
    {
      companyId: techflow.id,
      title: "【週3-5日/フルリモート/Ruby on Rails】バックエンドエンジニア - 教育系SaaSの機能開発",
      summary:
        "教育機関向けSaaSの機能開発・改善。Railsでの開発に加え、フロントエンド（React）にも興味のある方歓迎です。",
      jobCategory: "バックエンドエンジニア",
      rateMax: 820000,
      weeklyDaysMin: 3,
      weeklyDaysMax: 5,
      remoteType: "FULL_REMOTE",
      industry: "教育・SaaS",
      features: ["BtoB", "自社サービス", "土日祝日休み", "週3日以下可"],
      merits:
        "教育という社会貢献性の高いドメインで開発できます\n安定した既存プロダクトの改善と新機能開発の両方に携われます",
      description:
        "・Ruby on RailsによるAPI開発\n・既存機能の改善・リファクタリング\n・Reactを用いた管理画面の開発（希望者）",
      required: "Ruby on Railsでの開発経験3年以上\nRSpec等を用いたテスト経験",
      preferred: "Reactでのフロントエンド開発経験\nSaaSプロダクトの開発経験",
      skills: ["Ruby", "Ruby on Rails", "React", "PostgreSQL"],
      publishedAt: daysAgo(8),
      viewCount: 140,
    },
  ];

  const createdProjects: { id: string; title: string; companyId: string }[] = [];
  for (const p of projects) {
    const created = await prisma.project.create({
      data: {
        companyId: p.companyId,
        title: p.title,
        summary: p.summary,
        jobCategory: p.jobCategory,
        status: "OPEN",
        publishedAt: p.publishedAt,
        rateMin: p.rateMin ?? null,
        rateMax: p.rateMax,
        weeklyDaysMin: p.weeklyDaysMin,
        weeklyDaysMax: p.weeklyDaysMax,
        remoteType: p.remoteType,
        location: p.location ?? null,
        industry: p.industry ?? null,
        features: p.features,
        merits: p.merits,
        background: p.background ?? null,
        description: p.description,
        requiredSkillsText: p.required,
        preferredSkillsText: p.preferred,
        idealCandidate: p.ideal ?? null,
        devEnvironment: p.devEnv ?? null,
        viewCount: p.viewCount,
        skills: { create: skillIds(p.skills) },
      },
    });
    createdProjects.push({ id: created.id, title: created.title, companyId: created.companyId });
  }

  // ---- デモ用の応募 + チャット ----
  const targetProject = createdProjects[0]; // テックフローのフルスタック案件
  const application = await prisma.application.create({
    data: {
      projectId: targetProject.id,
      engineerUserId: engineerUser.id,
      status: "SCREENING",
      message:
        "はじめまして。山田と申します。直近3年はTypeScript/Next.js/NestJSでSaaSのMVP開発をリードしており、本案件の0→1フェーズで貢献できると考え応募いたしました。",
    },
  });
  const applicationConversation = await prisma.conversation.create({
    data: {
      companyId: targetProject.companyId,
      engineerUserId: engineerUser.id,
      projectId: targetProject.id,
      applicationId: application.id,
    },
  });
  await prisma.message.createMany({
    data: [
      {
        conversationId: applicationConversation.id,
        senderId: engineerUser.id,
        body: "はじめまして。山田と申します。直近3年はTypeScript/Next.js/NestJSでSaaSのMVP開発をリードしており、本案件の0→1フェーズで貢献できると考え応募いたしました。",
        createdAt: daysAgo(1),
        readAt: daysAgo(1),
      },
      {
        conversationId: applicationConversation.id,
        senderId: companyUser.id,
        body: "山田様、ご応募ありがとうございます！ご経歴を拝見し、ぜひ一度オンラインでお話しさせていただきたいです。今週のご都合はいかがでしょうか？",
        createdAt: daysAgo(0),
      },
    ],
  });

  // ---- デモ用のスカウト + チャット ----
  const satoUser = await prisma.user.findUniqueOrThrow({ where: { email: "sato@example.com" } });
  const mlProject = createdProjects[1]; // AIワークスのML案件
  const scout = await prisma.scout.create({
    data: {
      companyId: aiwork.id,
      projectId: mlProject.id,
      engineerUserId: satoUser.id,
      senderUserId: (await prisma.user.findUniqueOrThrow({ where: { email: "company2@example.com" } })).id,
      title: "画像系MLのご経験を拝見してご連絡しました",
      message:
        "佐藤様\n\nはじめまして。AIワークスの採用担当です。類似画像検索の精度改善プロジェクトで、佐藤様の画像系MLのご経験がまさにマッチすると考えご連絡いたしました。\n\n週3日・フルリモートでの参画が可能です。ご興味をお持ちいただけましたら、ぜひチャットでお気軽にご返信ください。",
      status: "SENT",
    },
  });
  await prisma.conversation.create({
    data: {
      companyId: aiwork.id,
      engineerUserId: satoUser.id,
      projectId: mlProject.id,
      scoutId: scout.id,
      messages: {
        create: {
          senderId: scout.senderUserId,
          body: "佐藤様\n\nはじめまして。AIワークスの採用担当です。類似画像検索の精度改善プロジェクトで、佐藤様の画像系MLのご経験がまさにマッチすると考えご連絡いたしました。\n\n週3日・フルリモートでの参画が可能です。ご興味をお持ちいただけましたら、ぜひチャットでお気軽にご返信ください。",
        },
      },
    },
  });

  // ---- 保存した案件 ----
  await prisma.savedProject.createMany({
    data: [
      { userId: engineerUser.id, projectId: createdProjects[3].id },
      { userId: engineerUser.id, projectId: createdProjects[6].id },
    ],
  });

  console.log("✅ シード完了");
  console.log("デモアカウント:");
  console.log("  エンジニア: engineer@example.com / password123");
  console.log("  エンジニア（スカウト受信済み）: sato@example.com / password123");
  console.log("  企業:       company@example.com / password123 (株式会社テックフロー)");
  console.log("  企業2:      company2@example.com / password123 (AIワークス株式会社)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
