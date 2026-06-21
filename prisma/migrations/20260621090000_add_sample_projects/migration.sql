ALTER TABLE "Project" ADD COLUMN "isSample" BOOLEAN NOT NULL DEFAULT false;

INSERT INTO "Company" ("id", "name", "description", "industry", "website", "location", "updatedAt")
VALUES
  ('sample_company_techflow', '株式会社テックフロー（サンプル）', 'サンプル案件を表示するための架空企業です。実在の募集元ではありません。', 'ITサービス系', 'https://example.com/sample-techflow', '東京都渋谷区', CURRENT_TIMESTAMP),
  ('sample_company_aiworks', 'AIワークス株式会社（サンプル）', 'サンプル案件を表示するための架空企業です。実在の募集元ではありません。', 'AI・機械学習', 'https://example.com/sample-aiworks', '東京都港区', CURRENT_TIMESTAMP),
  ('sample_company_finbase', 'フィンベース株式会社（サンプル）', 'サンプル案件を表示するための架空企業です。実在の募集元ではありません。', 'FinTech', 'https://example.com/sample-finbase', '大阪府大阪市', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "industry" = EXCLUDED."industry",
  "website" = EXCLUDED."website",
  "location" = EXCLUDED."location",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Project" (
  "id",
  "companyId",
  "title",
  "summary",
  "jobCategory",
  "status",
  "isSample",
  "publishedAt",
  "rateMin",
  "rateMax",
  "weeklyDaysMin",
  "weeklyDaysMax",
  "remoteType",
  "location",
  "contractType",
  "industry",
  "merits",
  "background",
  "description",
  "requiredSkillsText",
  "preferredSkillsText",
  "idealCandidate",
  "devEnvironment",
  "features",
  "viewCount",
  "updatedAt"
)
VALUES
  ('sample_project_01', 'sample_company_techflow', '【サンプル案件】週3-5日/フルリモート/TypeScript,Next.js フルスタックエンジニア', 'これはマッチング体験と希望条件確認のためのサンプル案件です。実際の募集案件ではありません。BtoB SaaSのMVP開発を想定した案件例です。', 'フルスタックエンジニア', 'OPEN', true, CURRENT_TIMESTAMP - INTERVAL '1 day', 800000, 1200000, 3, 5, 'FULL_REMOTE', '東京都渋谷区', '業務委託', 'AI・不動産テック', '0→1開発の流れを想定したサンプルです。プロフィールとのマッチ確認に利用できます。', 'サンプルデータとして作成しています。実在の募集背景ではありません。', '要件整理、Next.js/API開発、LLM活用機能のプロトタイプ開発を想定しています。', 'TypeScriptでのWeb開発経験\nNext.jsまたはReactの経験', 'LLM/API連携の経験\nSaaSのMVP開発経験', '自走して仕様を整理できる方', 'Next.js, TypeScript, PostgreSQL, AWS', ARRAY['サンプル案件','BtoB','フルリモート','生成AI活用'], 0, CURRENT_TIMESTAMP),
  ('sample_project_02', 'sample_company_aiworks', '【サンプル案件】週2-4日/フルリモート/Python 機械学習エンジニア', 'これはマッチング体験と希望条件確認のためのサンプル案件です。実際の募集案件ではありません。画像検索モデル改善を想定した案件例です。', '機械学習エンジニア', 'OPEN', true, CURRENT_TIMESTAMP - INTERVAL '2 days', 700000, 960000, 2, 4, 'FULL_REMOTE', NULL, '業務委託', 'AI・機械学習', '機械学習案件への興味やスキル確認に使えるサンプルです。', 'サンプルデータとして作成しています。実在の募集背景ではありません。', 'Pythonを用いたモデル改善、評価指標の整理、API連携の検証を想定しています。', 'Pythonでの機械学習PoC経験\n画像または検索系モデルの知識', 'FastAPIでのAPI開発経験\nクラウド環境での検証経験', '研究と実装のバランスを取れる方', 'Python, FastAPI, Google Cloud', ARRAY['サンプル案件','週3日以下可','フルリモート'], 0, CURRENT_TIMESTAMP),
  ('sample_project_03', 'sample_company_aiworks', '【サンプル案件】週5日/リモートメイン/Python LLMアプリケーション開発', 'これはマッチング体験と希望条件確認のためのサンプル案件です。実際の募集案件ではありません。RAGを含むLLM活用支援の案件例です。', 'AI・LLMエンジニア', 'OPEN', true, CURRENT_TIMESTAMP, 650000, 900000, 5, 5, 'REMOTE_MAIN', '東京都品川区', '業務委託', '通信', 'LLM/RAG系の希望条件を確認するためのサンプルです。', 'サンプルデータとして作成しています。実在の募集背景ではありません。', 'RAGパイプライン設計、プロンプト改善、社内向けAI機能の実装を想定しています。', 'Pythonでの開発経験\nLLM APIを用いた開発経験', 'RAGまたはLangChain等の利用経験', '新しい技術を実務に落とし込める方', 'Python, OpenAI API, AWS, Docker', ARRAY['サンプル案件','長期案件','生成AI活用'], 0, CURRENT_TIMESTAMP),
  ('sample_project_04', 'sample_company_finbase', '【サンプル案件】週4-5日/フルリモート/Go,TypeScript 決済基盤バックエンド', 'これはマッチング体験と希望条件確認のためのサンプル案件です。実際の募集案件ではありません。金融システム開発を想定した案件例です。', 'バックエンドエンジニア', 'OPEN', true, CURRENT_TIMESTAMP - INTERVAL '4 days', 850000, 1100000, 4, 5, 'FULL_REMOTE', '東京都港区', '業務委託', 'FinTech', 'Goや金融ドメイン経験とのマッチ確認に使えます。', 'サンプルデータとして作成しています。実在の募集背景ではありません。', '決済API、トランザクション処理、マイクロサービス設計を想定しています。', 'GoまたはJavaでのバックエンド開発経験\nRDB設計の知識', '金融システムの開発経験\nKubernetes運用経験', '品質と堅牢性を重視できる方', 'Go, TypeScript, PostgreSQL, Kubernetes', ARRAY['サンプル案件','BtoB','フルリモート','長期案件'], 0, CURRENT_TIMESTAMP),
  ('sample_project_05', 'sample_company_techflow', '【サンプル案件】週3-4日/フルリモート/React,Next.js フロントエンド開発', 'これはマッチング体験と希望条件確認のためのサンプル案件です。実際の募集案件ではありません。設計支援SaaSのUI開発を想定した案件例です。', 'フロントエンドエンジニア', 'OPEN', true, CURRENT_TIMESTAMP - INTERVAL '6 days', 650000, 890000, 3, 4, 'FULL_REMOTE', '東京都新宿区', '業務委託', 'SaaS', 'UI/UX寄りのフロントエンド案件との相性確認に使えます。', 'サンプルデータとして作成しています。実在の募集背景ではありません。', 'React/Next.jsでの画面開発、デザインシステム整備、表示速度改善を想定しています。', 'React/TypeScriptでの開発経験\nコンポーネント設計の知識', 'Figma連携経験\nアクセシビリティ改善経験', 'UIの細部に気を配れる方', 'React, Next.js, TypeScript, Figma', ARRAY['サンプル案件','BtoB','週3日以下可'], 0, CURRENT_TIMESTAMP),
  ('sample_project_06', 'sample_company_finbase', '【サンプル案件】週5日/一部リモート/Kotlin Androidアプリ開発', 'これはマッチング体験と希望条件確認のためのサンプル案件です。実際の募集案件ではありません。金融アプリ開発を想定した案件例です。', 'モバイルエンジニア', 'OPEN', true, CURRENT_TIMESTAMP - INTERVAL '9 days', 650000, 850000, 5, 5, 'PARTIAL_REMOTE', '大阪府大阪市', '業務委託', 'FinTech', 'モバイルアプリ経験とのマッチ確認に使えるサンプルです。', 'サンプルデータとして作成しています。実在の募集背景ではありません。', 'Kotlin/Jetpack ComposeによるAndroidアプリ開発を想定しています。', 'KotlinでのAndroidアプリ開発経験\nリリース運用経験', 'Jetpack Compose経験\niOS開発経験', 'プロダクト目線で改善提案できる方', 'Kotlin, GraphQL, Firebase', ARRAY['サンプル案件','BtoC','一部リモート'], 0, CURRENT_TIMESTAMP),
  ('sample_project_07', 'sample_company_techflow', '【サンプル案件】週4-5日/フルリモート/AWS,Terraform SRE', 'これはマッチング体験と希望条件確認のためのサンプル案件です。実際の募集案件ではありません。SaaS基盤改善を想定した案件例です。', 'SRE', 'OPEN', true, CURRENT_TIMESTAMP - INTERVAL '3 days', 800000, 1150000, 4, 5, 'FULL_REMOTE', NULL, '業務委託', 'SaaS', 'インフラ/SRE志向を確認するためのサンプルです。', 'サンプルデータとして作成しています。実在の募集背景ではありません。', 'TerraformによるIaC、監視整備、CI/CD改善を想定しています。', 'AWSでのインフラ構築・運用経験\nTerraform利用経験', 'SLO/SLI運用経験\nDatadog等のAPM経験', 'サービス信頼性を継続的に改善できる方', 'AWS, Terraform, Kubernetes, Docker', ARRAY['サンプル案件','フルリモート','長期案件'], 0, CURRENT_TIMESTAMP),
  ('sample_project_08', 'sample_company_aiworks', '【サンプル案件】週3日/フルリモート/Python データエンジニア', 'これはマッチング体験と希望条件確認のためのサンプル案件です。実際の募集案件ではありません。製造業向けデータ基盤を想定した案件例です。', 'データエンジニア', 'OPEN', true, CURRENT_TIMESTAMP - INTERVAL '12 days', 650000, 900000, 3, 4, 'FULL_REMOTE', NULL, '業務委託', '製造業・データ活用', 'データ基盤構築経験とのマッチ確認に使えます。', 'サンプルデータとして作成しています。実在の募集背景ではありません。', 'BigQuery中心のDWH設計、dbtによるモデリング、ETL整備を想定しています。', 'SQLでのデータモデリング経験\nPythonでのETL/ELT経験', 'dbt利用経験\nLooker等のBI経験', 'データ品質まで意識できる方', 'Python, BigQuery, dbt, Google Cloud', ARRAY['サンプル案件','週3日以下可','フルリモート'], 0, CURRENT_TIMESTAMP),
  ('sample_project_09', 'sample_company_finbase', '【サンプル案件】週5日/出社メイン/Java,Spring Boot 基幹システム刷新', 'これはマッチング体験と希望条件確認のためのサンプル案件です。実際の募集案件ではありません。金融基幹システム移行を想定した案件例です。', 'バックエンドエンジニア', 'OPEN', true, CURRENT_TIMESTAMP - INTERVAL '15 days', 600000, 750000, 5, 5, 'ONSITE_MAIN', '愛知県名古屋市', '業務委託', '金融', 'Java/Spring経験や出社条件の確認に使えるサンプルです。', 'サンプルデータとして作成しています。実在の募集背景ではありません。', 'Spring Bootによるマイクロサービス化、既存コード解析、結合テストを想定しています。', 'Javaでの開発経験\nSpring Framework利用経験', '金融系システム開発経験\n移行プロジェクト経験', '安定稼働と品質を重視できる方', 'Java, Spring Boot, MySQL, Docker', ARRAY['サンプル案件','出社メイン','長期案件'], 0, CURRENT_TIMESTAMP),
  ('sample_project_10', 'sample_company_techflow', '【サンプル案件】週2-3日/フルリモート/PM 受託開発の進行管理', 'これはマッチング体験と希望条件確認のためのサンプル案件です。実際の募集案件ではありません。複数受託案件のPM支援を想定した案件例です。', 'プロジェクトマネージャー', 'OPEN', true, CURRENT_TIMESTAMP - INTERVAL '7 days', 600000, 800000, 2, 3, 'FULL_REMOTE', NULL, '業務委託', 'ITサービス系', 'PM/進行管理の希望条件を確認するためのサンプルです。', 'サンプルデータとして作成しています。実在の募集背景ではありません。', 'クライアント折衝、要件調整、開発チームのタスク管理を想定しています。', 'Web系開発プロジェクトのPM経験\nクライアント折衝経験', 'アジャイル開発経験\nエンジニアバックグラウンド', '複数関係者を整理して前に進められる方', 'Backlog, Slack, GitHub', ARRAY['サンプル案件','週3日以下可','フルリモート'], 0, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET
  "companyId" = EXCLUDED."companyId",
  "title" = EXCLUDED."title",
  "summary" = EXCLUDED."summary",
  "jobCategory" = EXCLUDED."jobCategory",
  "status" = EXCLUDED."status",
  "isSample" = EXCLUDED."isSample",
  "publishedAt" = EXCLUDED."publishedAt",
  "rateMin" = EXCLUDED."rateMin",
  "rateMax" = EXCLUDED."rateMax",
  "weeklyDaysMin" = EXCLUDED."weeklyDaysMin",
  "weeklyDaysMax" = EXCLUDED."weeklyDaysMax",
  "remoteType" = EXCLUDED."remoteType",
  "location" = EXCLUDED."location",
  "contractType" = EXCLUDED."contractType",
  "industry" = EXCLUDED."industry",
  "merits" = EXCLUDED."merits",
  "background" = EXCLUDED."background",
  "description" = EXCLUDED."description",
  "requiredSkillsText" = EXCLUDED."requiredSkillsText",
  "preferredSkillsText" = EXCLUDED."preferredSkillsText",
  "idealCandidate" = EXCLUDED."idealCandidate",
  "devEnvironment" = EXCLUDED."devEnvironment",
  "features" = EXCLUDED."features",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Skill" ("id", "name", "category")
VALUES
  ('sample_skill_typescript', 'TypeScript', 'LANGUAGE'),
  ('sample_skill_nextjs', 'Next.js', 'FRAMEWORK'),
  ('sample_skill_react', 'React', 'FRAMEWORK'),
  ('sample_skill_python', 'Python', 'LANGUAGE'),
  ('sample_skill_fastapi', 'FastAPI', 'FRAMEWORK'),
  ('sample_skill_go', 'Go', 'LANGUAGE'),
  ('sample_skill_java', 'Java', 'LANGUAGE'),
  ('sample_skill_spring_boot', 'Spring Boot', 'FRAMEWORK'),
  ('sample_skill_kotlin', 'Kotlin', 'LANGUAGE'),
  ('sample_skill_aws', 'AWS', 'INFRA'),
  ('sample_skill_terraform', 'Terraform', 'INFRA'),
  ('sample_skill_kubernetes', 'Kubernetes', 'INFRA'),
  ('sample_skill_postgresql', 'PostgreSQL', 'DATABASE'),
  ('sample_skill_mysql', 'MySQL', 'DATABASE'),
  ('sample_skill_bigquery', 'BigQuery', 'DATABASE'),
  ('sample_skill_docker', 'Docker', 'TOOL'),
  ('sample_skill_figma', 'Figma', 'TOOL')
ON CONFLICT ("name") DO UPDATE SET "category" = EXCLUDED."category";

INSERT INTO "ProjectSkill" ("projectId", "skillId")
SELECT desired."projectId", "Skill"."id"
FROM (
  VALUES
    ('sample_project_01', 'TypeScript'),
    ('sample_project_01', 'Next.js'),
    ('sample_project_01', 'Python'),
    ('sample_project_01', 'AWS'),
    ('sample_project_02', 'Python'),
    ('sample_project_02', 'FastAPI'),
    ('sample_project_03', 'Python'),
    ('sample_project_03', 'AWS'),
    ('sample_project_03', 'Docker'),
    ('sample_project_04', 'Go'),
    ('sample_project_04', 'TypeScript'),
    ('sample_project_04', 'PostgreSQL'),
    ('sample_project_04', 'Kubernetes'),
    ('sample_project_05', 'TypeScript'),
    ('sample_project_05', 'React'),
    ('sample_project_05', 'Next.js'),
    ('sample_project_05', 'Figma'),
    ('sample_project_06', 'Kotlin'),
    ('sample_project_07', 'AWS'),
    ('sample_project_07', 'Terraform'),
    ('sample_project_07', 'Kubernetes'),
    ('sample_project_07', 'Docker'),
    ('sample_project_08', 'Python'),
    ('sample_project_08', 'BigQuery'),
    ('sample_project_09', 'Java'),
    ('sample_project_09', 'Spring Boot'),
    ('sample_project_09', 'MySQL'),
    ('sample_project_09', 'Docker'),
    ('sample_project_10', 'TypeScript'),
    ('sample_project_10', 'Python')
) AS desired("projectId", "skillName")
JOIN "Skill" ON "Skill"."name" = desired."skillName"
ON CONFLICT ("projectId", "skillId") DO NOTHING;
