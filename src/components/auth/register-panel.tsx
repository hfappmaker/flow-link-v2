"use client";

import Link from "next/link";
import { useState } from "react";
import { OAuthButtons, type OAuthAvailability } from "@/components/auth/oauth-buttons";
import { RegisterForm } from "@/components/auth/register-form";

export function RegisterPanel({
  availability,
  defaultRole,
}: {
  availability: OAuthAvailability;
  defaultRole: "ENGINEER" | "COMPANY";
}) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  return (
    <>
      <OAuthButtons availability={availability} disabled={!agreedToTerms} />
      <RegisterForm defaultRole={defaultRole} agreedToTerms={agreedToTerms} />
      <label className="mt-4 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(event) => setAgreedToTerms(event.currentTarget.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span>
          <Link href="/terms" className="font-semibold text-blue-600 hover:underline">
            利用規約
          </Link>
          および
          <Link href="/privacy" className="font-semibold text-blue-600 hover:underline">
            プライバシーポリシー
          </Link>
          に同意します
        </span>
      </label>
    </>
  );
}
