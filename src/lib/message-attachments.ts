export type MessageAttachmentPayload = {
  id: string;
  kind: string;
  label: string;
  fileName: string;
  downloadUrl: string;
};

export function getAttachmentLabel() {
  return "添付ファイル";
}
