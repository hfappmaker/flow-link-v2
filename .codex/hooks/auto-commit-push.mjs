import { execFile } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function writeHookResult(result) {
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

function hookMessage(message) {
  return {
    continue: true,
    systemMessage: message,
  };
}

async function git(args, options = {}) {
  const result = await execFileAsync("git", args, {
    cwd: options.cwd,
    maxBuffer: 1024 * 1024,
  });
  return result.stdout.trim();
}

async function main() {
  const input = await new Promise((resolve) => {
    let body = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      body += chunk;
    });
    process.stdin.on("end", () => resolve(body));
  });

  let payload = {};
  try {
    payload = input ? JSON.parse(input) : {};
  } catch {
    payload = {};
  }

  const cwd = payload.cwd || process.cwd();
  const root = await git(["rev-parse", "--show-toplevel"], { cwd });

  const gitDir = await git(["rev-parse", "--git-dir"], { cwd: root });
  const absoluteGitDir = path.isAbsolute(gitDir) ? gitDir : path.join(root, gitDir);
  const inProgress = await Promise.all(
    ["MERGE_HEAD", "rebase-merge", "rebase-apply", "CHERRY_PICK_HEAD", "REVERT_HEAD"].map(async (marker) => {
      try {
        await access(path.join(absoluteGitDir, marker));
        return true;
      } catch {
        return false;
      }
    }),
  );
  if (inProgress.some(Boolean)) {
    writeHookResult(hookMessage("Auto commit skipped: repository is in the middle of a merge/rebase/cherry-pick."));
    return;
  }

  const statusBefore = await git(["status", "--porcelain"], { cwd: root });
  if (!statusBefore) {
    writeHookResult({ continue: true });
    return;
  }

  const branch = await git(["branch", "--show-current"], { cwd: root });
  if (!branch) {
    writeHookResult(hookMessage("Auto commit skipped: detached HEAD has no branch to push."));
    return;
  }

  let upstream = "";
  let pushArgs = ["push"];
  try {
    upstream = await git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], { cwd: root });
  } catch {
    upstream = `origin/${branch}`;
    pushArgs = ["push", "-u", "origin", branch];
  }

  if (process.env.CODEX_AUTO_COMMIT_DRY_RUN === "1") {
    writeHookResult(hookMessage(`Auto commit dry run: would commit and push ${branch} to ${upstream}.`));
    return;
  }

  await git(["add", "-A"], { cwd: root });
  const staged = await git(["diff", "--cached", "--name-only"], { cwd: root });
  if (!staged) {
    writeHookResult({ continue: true });
    return;
  }

  const firstPaths = staged.split(/\r?\n/).slice(0, 4).join(", ");
  const suffix = staged.split(/\r?\n/).length > 4 ? ", ..." : "";
  const message = `Codex auto-commit: ${firstPaths}${suffix}`;

  await git(["commit", "-m", message], { cwd: root });
  await git(pushArgs, { cwd: root });

  writeHookResult(hookMessage(`Auto committed and pushed ${branch} to ${upstream}: ${message}`));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  writeHookResult(hookMessage(`Auto commit/push failed: ${message}`));
});
