import { tmpdir } from "node:os";
import path from "node:path";

export function getProfileDocumentsRoot() {
  const baseDir = process.env.VERCEL
    ? path.join(tmpdir(), "flow-link")
    : process.cwd();

  return path.resolve(baseDir, ".uploads", "engineer-documents");
}
