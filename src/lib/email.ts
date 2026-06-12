import { Resend } from "resend";

const from = process.env.EMAIL_FROM ?? "FlowLink <onboarding@resend.dev>";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });
}

function buttonHtml(href: string, label: string) {
  return `
    <a href="${escapeHtml(href)}" style="display:inline-block;border-radius:10px;background:#2563eb;color:#ffffff;font-weight:700;text-decoration:none;padding:12px 18px;">
      ${escapeHtml(label)}
    </a>
  `;
}

function baseEmailHtml({
  heading,
  intro,
  actionUrl,
  actionLabel,
  note,
}: {
  heading: string;
  intro: string;
  actionUrl: string;
  actionLabel: string;
  note: string;
}) {
  return `
    <div style="margin:0;background:#f8fafc;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;">
      <div style="margin:0 auto;max-width:560px;border:1px solid #e2e8f0;border-radius:14px;background:#ffffff;padding:28px;">
        <p style="margin:0 0 18px;font-size:20px;font-weight:900;color:#0f172a;">FlowLink</p>
        <h1 style="margin:0 0 12px;font-size:22px;line-height:1.35;color:#0f172a;">${escapeHtml(heading)}</h1>
        <p style="margin:0 0 22px;font-size:14px;line-height:1.8;color:#475569;">${escapeHtml(intro)}</p>
        ${buttonHtml(actionUrl, actionLabel)}
        <p style="margin:22px 0 0;font-size:12px;line-height:1.7;color:#64748b;">${escapeHtml(note)}</p>
        <p style="margin:14px 0 0;font-size:12px;line-height:1.7;color:#64748b;word-break:break-all;">
          ボタンが開けない場合は、以下のURLをブラウザに貼り付けてください。<br />
          <a href="${escapeHtml(actionUrl)}" style="color:#2563eb;">${escapeHtml(actionUrl)}</a>
        </p>
      </div>
    </div>
  `;
}

async function sendTransactionalEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  await sendTransactionalEmail({
    to,
    subject: "FlowLink メールアドレスの確認",
    html: baseEmailHtml({
      heading: "メールアドレスを確認してください",
      intro: "FlowLinkへの登録を完了するには、以下のボタンからメールアドレスを確認してください。",
      actionUrl: verifyUrl,
      actionLabel: "メールアドレスを確認する",
      note: "このリンクの有効期限は24時間です。心当たりがない場合、このメールは破棄してください。",
    }),
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await sendTransactionalEmail({
    to,
    subject: "FlowLink パスワード再設定",
    html: baseEmailHtml({
      heading: "パスワードを再設定できます",
      intro: "以下のボタンから新しいパスワードを設定してください。",
      actionUrl: resetUrl,
      actionLabel: "パスワードを再設定する",
      note: "このリンクの有効期限は1時間です。心当たりがない場合、このメールは破棄してください。",
    }),
  });
}
