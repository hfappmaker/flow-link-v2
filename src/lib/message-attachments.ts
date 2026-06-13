import type { EngineerProfile } from "@prisma/client";

export const CHAT_DOCUMENT_KINDS = ["resume", "work-history"] as const;

export type ChatDocumentKind = (typeof CHAT_DOCUMENT_KINDS)[number];

export type AvailableChatDocument = {
  kind: ChatDocumentKind;
  label: string;
  fileName: string;
};

export type MessageAttachmentPayload = AvailableChatDocument & {
  id: string;
  downloadUrl: string;
};

export type ProfileMessageDocument = {
  kind: ChatDocumentKind;
  fileName: string;
  filePath: string;
};

type ProfileDocumentFields = Pick<
  EngineerProfile,
  "resumeFileName" | "resumeFilePath" | "workHistoryFileName" | "workHistoryFilePath"
>;

export const CHAT_DOCUMENT_LABELS: Record<ChatDocumentKind, string> = {
  resume: "履歴書",
  "work-history": "職務経歴書",
};

export function getAvailableChatDocuments(profile: ProfileDocumentFields): AvailableChatDocument[] {
  return [
    profile.resumeFileName && profile.resumeFilePath
      ? { kind: "resume" as const, label: CHAT_DOCUMENT_LABELS.resume, fileName: profile.resumeFileName }
      : null,
    profile.workHistoryFileName && profile.workHistoryFilePath
      ? {
          kind: "work-history" as const,
          label: CHAT_DOCUMENT_LABELS["work-history"],
          fileName: profile.workHistoryFileName,
        }
      : null,
  ].filter((document): document is AvailableChatDocument => Boolean(document));
}

export function getProfileDocumentsForMessage(
  profile: ProfileDocumentFields,
  selectedKinds: ChatDocumentKind[],
): Array<ProfileMessageDocument | null> {
  const uniqueKinds = [...new Set(selectedKinds)];

  return uniqueKinds.map((kind) => {
    if (kind === "resume") {
      return profile.resumeFileName && profile.resumeFilePath
        ? {
            kind,
            fileName: profile.resumeFileName,
            filePath: profile.resumeFilePath,
          }
        : null;
    }

    return profile.workHistoryFileName && profile.workHistoryFilePath
      ? {
          kind,
          fileName: profile.workHistoryFileName,
          filePath: profile.workHistoryFilePath,
        }
      : null;
  });
}

export function isChatDocumentKind(value: unknown): value is ChatDocumentKind {
  return typeof value === "string" && (CHAT_DOCUMENT_KINDS as readonly string[]).includes(value);
}

export function isProfileMessageDocument(
  document: ProfileMessageDocument | null,
): document is ProfileMessageDocument {
  return Boolean(document);
}
