import { getAppUrl } from "@/lib/app-url";
import { sendNotificationEmail } from "@/lib/email";

type NotificationRecipient = {
  email: string;
  emailNotificationsEnabled: boolean;
  deletedAt?: Date | null;
};

type NotificationEmailInput = {
  recipients: NotificationRecipient[];
  subject: string;
  heading: string;
  intro: string;
  path: string;
  actionLabel: string;
};

export async function sendOptionalNotificationEmail({
  recipients,
  subject,
  heading,
  intro,
  path,
  actionLabel,
}: NotificationEmailInput) {
  const enabledRecipients = [
    ...new Map(
      recipients
        .filter((recipient) => recipient.emailNotificationsEnabled && !recipient.deletedAt)
        .map((recipient) => [recipient.email.toLowerCase(), recipient]),
    ).values(),
  ];
  if (enabledRecipients.length === 0) return;

  const actionUrl = new URL(path, getAppUrl()).toString();
  const results = await Promise.allSettled(
    enabledRecipients.map((recipient) =>
      sendNotificationEmail({
        to: recipient.email,
        subject,
        heading,
        intro,
        actionUrl,
        actionLabel,
      }),
    ),
  );

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Failed to send notification email", result.reason);
    }
  }
}
