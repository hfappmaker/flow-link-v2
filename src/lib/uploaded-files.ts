import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, put } from "@vercel/blob";

const BLOB_REF_PREFIX = "blob:";

export const MESSAGE_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const MESSAGE_ATTACHMENT_MAX_COUNT = 5;

export function sanitizeUploadFileName(fileName: string) {
  const baseName = path.basename(fileName).trim() || "attachment";
  return baseName.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").slice(0, 160);
}

function getUploadsBaseDir() {
  return process.env.VERCEL ? path.join(tmpdir(), "flow-link") : process.cwd();
}

export function getMessageAttachmentsRoot() {
  return path.resolve(getUploadsBaseDir(), ".uploads", "message-attachments");
}

function canUseBlobStorage() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN),
  );
}

function toBlobRef(pathname: string) {
  return `${BLOB_REF_PREFIX}${pathname}`;
}

function fromBlobRef(filePath: string) {
  return filePath.startsWith(BLOB_REF_PREFIX)
    ? filePath.slice(BLOB_REF_PREFIX.length)
    : null;
}

function assertLocalPath(filePath: string, root: string) {
  const uploadRoot = path.resolve(root);
  const documentPath = path.resolve(filePath);
  if (!documentPath.startsWith(`${uploadRoot}${path.sep}`)) return null;
  return documentPath;
}

export async function saveMessageAttachmentFile({
  conversationId,
  file,
  fileName,
}: {
  conversationId: string;
  file: File;
  fileName: string;
}) {
  const storedName = `${Date.now()}-${randomUUID()}-${fileName}`;

  if (canUseBlobStorage()) {
    const pathname = `message-attachments/${conversationId}/${storedName}`;
    const blob = await put(pathname, file, {
      access: "private",
      contentType: file.type || "application/octet-stream",
    });
    return toBlobRef(blob.pathname);
  }

  const uploadDir = path.join(getMessageAttachmentsRoot(), conversationId);
  await mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, storedName);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  return filePath;
}

export async function readStoredFile(filePath: string, root = getMessageAttachmentsRoot()) {
  const blobPathname = fromBlobRef(filePath);
  if (blobPathname) {
    const result = await get(blobPathname, { access: "private" });
    if (!result || result.statusCode !== 200) return null;
    return result.stream;
  }

  const documentPath = assertLocalPath(filePath, root);
  if (!documentPath) return null;
  const file = await readFile(documentPath);
  return new Uint8Array(file);
}

export async function removeStoredFile(filePath: string | null | undefined) {
  if (!filePath) return;

  const blobPathname = fromBlobRef(filePath);
  if (blobPathname) {
    await del(blobPathname).catch(() => undefined);
    return;
  }

  await rm(filePath, { force: true });
}
