export const DELETED_USER_DISPLAY_NAME = "退会済みユーザー";
export const DELETED_COMPANY_NAME = "退会済み企業";

export function buildDeletedAccountEmail(userId: string, email: string) {
  return `deleted:${userId}:${email}`;
}

export function isDeleteAccountConfirmed(formData: FormData) {
  return formData.get("confirm") === "on";
}
