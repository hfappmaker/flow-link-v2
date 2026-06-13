import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DELETED_COMPANY_NAME,
  DELETED_USER_DISPLAY_NAME,
  buildDeletedAccountEmail,
  isDeleteAccountConfirmed,
} from "../src/lib/account-deletion";

describe("account deletion helpers", () => {
  it("builds an anonymized email that frees the original unique email", () => {
    assert.equal(
      buildDeletedAccountEmail("user-1", "user@example.com"),
      "deleted:user-1:user@example.com",
    );
  });

  it("recognizes the confirmation checkbox value", () => {
    const confirmed = new FormData();
    confirmed.set("confirm", "on");
    assert.equal(isDeleteAccountConfirmed(confirmed), true);

    const missing = new FormData();
    assert.equal(isDeleteAccountConfirmed(missing), false);
  });

  it("keeps deleted account display labels stable", () => {
    assert.equal(DELETED_USER_DISPLAY_NAME, "退会済みユーザー");
    assert.equal(DELETED_COMPANY_NAME, "退会済み企業");
  });
});
