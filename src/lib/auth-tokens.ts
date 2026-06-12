import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export type AuthTokenKind = "email-verification" | "password-reset";

function identifier(kind: AuthTokenKind, email: string) {
  return `${kind}:${email.toLowerCase()}`;
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createAuthToken(kind: AuthTokenKind, email: string, expiresInMinutes: number) {
  const normalizedEmail = email.toLowerCase();
  const rawToken = crypto.randomBytes(32).toString("base64url");
  const token = hashToken(rawToken);
  const tokenIdentifier = identifier(kind, normalizedEmail);
  const expires = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: { identifier: tokenIdentifier },
  });
  await prisma.verificationToken.create({
    data: {
      identifier: tokenIdentifier,
      token,
      expires,
    },
  });

  return rawToken;
}

export async function consumeAuthToken(kind: AuthTokenKind, rawToken: string) {
  const token = hashToken(rawToken);
  const prefix = `${kind}:`;

  await prisma.verificationToken.deleteMany({
    where: {
      expires: { lt: new Date() },
      identifier: { startsWith: prefix },
    },
  });

  const record = await prisma.verificationToken.findFirst({
    where: {
      token,
      identifier: { startsWith: prefix },
      expires: { gt: new Date() },
    },
  });

  if (!record) return null;

  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: record.identifier,
        token: record.token,
      },
    },
  });

  return record.identifier.slice(prefix.length);
}
