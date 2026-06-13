import type {
  ApplicationStatus,
  ProjectStatus,
  RemoteType,
  ScoutStatus,
  SkillCategory,
  WorkStatus,
} from "@prisma/client";

export const APP_NAME = "FlowLink";

export const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
] as const;

export const JOB_CATEGORIES = [
  "フロントエンドエンジニア",
  "バックエンドエンジニア",
  "フルスタックエンジニア",
  "システムエンジニア",
  "プログラマー",
  "モバイルエンジニア",
  "ゲームエンジニア",
  "インフラエンジニア",
  "SRE",
  "機械学習エンジニア",
  "AI・LLMエンジニア",
  "データサイエンティスト",
  "データエンジニア",
  "QAエンジニア",
  "セキュリティエンジニア",
  "PdM",
  "FDE",
  "プロジェクトマネージャー",
  "スクラムマスター",
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

export const WEEKLY_DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const;

export const PAGE_SIZE = 20;
