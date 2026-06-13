export const MESSAGE_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const MESSAGE_ATTACHMENT_MAX_COUNT = 5;
export const MESSAGE_ATTACHMENT_ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".txt",
  ".md",
  ".markdown",
] as const;
export const MESSAGE_ATTACHMENT_ACCEPT = MESSAGE_ATTACHMENT_ALLOWED_EXTENSIONS.join(",");
export const MESSAGE_ATTACHMENT_ALLOWED_LABEL = "PDF、Word、Excel、テキスト、Markdown";

export function isAllowedMessageAttachmentFile(fileName: string) {
  const normalized = fileName.toLowerCase();
  return MESSAGE_ATTACHMENT_ALLOWED_EXTENSIONS.some((ext) => normalized.endsWith(ext));
}
