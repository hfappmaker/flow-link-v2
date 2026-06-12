import type {
  ApplicationStatus,
  ProjectStatus,
  RemoteType,
  ScoutStatus,
  SkillCategory,
  WorkStatus,
} from "@prisma/client";

export const APP_NAME = "FlowLink";

export const JOB_CATEGORIES = [
  "フロントエンドエンジニア",
  "バックエンドエンジニア",
  "フルスタックエンジニア",
  "モバイルエンジニア",
  "インフラエンジニア",
  "SRE",
  "機械学習エンジニア",
  "AI・LLMエンジニア",
  "データサイエンティスト",
  "データエンジニア",
  "QAエンジニア",
  "セキュリティエンジニア",
  "プロジェクトマネージャー",
  "テックリード",
  "UI・UXデザイナー",
] as const;

export const REMOTE_TYPE_LABELS: Record<RemoteType, string> = {
  FULL_REMOTE: "フルリモート",
  REMOTE_MAIN: "リモートメイン",
  PARTIAL_REMOTE: "一部リモート",
  ONSITE_MAIN: "出社メイン",
};

export const WORK_STATUS_LABELS: Record<WorkStatus, string> = {
  AVAILABLE: "案件を探しています",
  OPEN_TO_OFFERS: "良い案件があれば検討します",
  UNAVAILABLE: "現在は受け付けていません",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "下書き",
  OPEN: "募集中",
  CLOSED: "募集終了",
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: "応募済み",
  SCREENING: "書類確認中",
  INTERVIEW: "面談調整中",
  OFFERED: "オファー",
  ACCEPTED: "成約",
  REJECTED: "見送り",
  WITHDRAWN: "辞退",
};

export const SCOUT_STATUS_LABELS: Record<ScoutStatus, string> = {
  SENT: "未対応",
  ACCEPTED: "興味あり",
  DECLINED: "辞退",
};

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  LANGUAGE: "言語",
  FRAMEWORK: "フレームワーク",
  INFRA: "インフラ",
  DATABASE: "データベース",
  TOOL: "ツール",
  OTHER: "その他",
};

export const PROJECT_FEATURES = [
  "BtoB",
  "BtoC",
  "自社サービス",
  "新規サービス開発",
  "長期案件",
  "週3日以下可",
  "土日祝日休み",
  "新技術に積極的",
  "生成AI活用企業",
  "面談1回",
  "急募",
  "English OK",
] as const;

export const WEEKLY_DAYS_OPTIONS = [1, 2, 3, 4, 5] as const;

export const PAGE_SIZE = 20;
