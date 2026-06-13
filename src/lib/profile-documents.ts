import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, put } from "@vercel/blob";

const BLOB_REF_PREFIX = "blob:";

export function getProfileDocumentsRoot() {
  const baseDir = process.env.VERCEL
    ? path.join(tmpdir(), "flow-link")
    : process.cwd();

  return path.resolve(baseDir, ".uploads", "engineer-documents");
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

function assertLocalDocumentPath(filePath: string) {
  const uploadsRoot = getProfileDocumentsRoot();
  const documentPath = path.resolve(filePath);
  if (!documentPath.startsWith(`${uploadsRoot}${path.sep}`)) return null;
  return documentPath;
}

export async function saveProfileDocumentFile({
  profileId,
  kind,
  ext,
  file,
  contentType,
}: {
  profileId: string;
  kind: "resume" | "work-history";
  ext: string;
  file: File;
  contentType: string;
}) {
  const fileName = `${kind}-${Date.now()}-${randomUUID()}${ext}`;

  if (canUseBlobStorage()) {
    const pathname = `engineer-documents/${profileId}/${fileName}`;
    const blob = await put(pathname, file, {
      access: "private",
      contentType,
    });
    return toBlobRef(blob.pathname);
  }

  const uploadDir = path.join(getProfileDocumentsRoot(), profileId);
  await mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  return filePath;
}

export async function removeProfileDocumentFile(filePath: string | null | undefined) {
  if (!filePath) return;

  const blobPathname = fromBlobRef(filePath);
  if (blobPathname) {
    await del(blobPathname).catch(() => undefined);
    return;
  }

  await rm(filePath, { force: true });
}

export async function readProfileDocumentFile(filePath: string) {
  const blobPathname = fromBlobRef(filePath);
  if (blobPathname) {
    const result = await get(blobPathname, { access: "private" });
    if (!result || result.statusCode !== 200) return null;
    return result.stream;
  }

  const documentPath = assertLocalDocumentPath(filePath);
  if (!documentPath) return null;
  const file = await readFile(documentPath);
  return new Uint8Array(file);
}
