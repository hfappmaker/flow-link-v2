import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const prismaCliPath = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url));

const maxAttempts = 5;
const transientPatterns = [
  /too many connections/i,
  /connection.*closed/i,
  /connection.*terminated/i,
  /timeout/i,
  /temporarily unavailable/i,
];

function runMigrateDeploy() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [prismaCliPath, "migrate", "deploy"], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });

    child.on("close", (code) => {
      resolve({ code: code ?? 1, output });
    });
  });
}

function isTransientFailure(output) {
  return transientPatterns.some((pattern) => pattern.test(output));
}

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const result = await runMigrateDeploy();
  if (result.code === 0) process.exit(0);

  if (attempt === maxAttempts || !isTransientFailure(result.output)) {
    process.exit(result.code);
  }

  const delayMs = attempt * 5000;
  console.warn(
    `Prisma migrate deploy failed with a transient database connection error. Retrying in ${delayMs / 1000}s (${attempt}/${maxAttempts})...`,
  );
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}
