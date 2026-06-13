import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { getAppUrl } from "../src/lib/app-url";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("getAppUrl", () => {
  it("prefers NEXT_PUBLIC_APP_URL over all other URL hints", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://public.example.test";
    process.env.AUTH_URL = "https://auth.example.test";
    process.env.VERCEL_URL = "preview.example.test";
    process.env.VERCEL_ENV = "preview";

    assert.equal(getAppUrl(), "https://public.example.test");
  });

  it("uses AUTH_URL when NEXT_PUBLIC_APP_URL is absent", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.AUTH_URL = "https://auth.example.test";

    assert.equal(getAppUrl(), "https://auth.example.test");
  });

  it("uses the preview deployment URL only for preview deployments", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.AUTH_URL;
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "flow-link-git-feature.vercel.app";

    assert.equal(getAppUrl(), "https://flow-link-git-feature.vercel.app");
  });

  it("falls back to the production URL and then localhost", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.AUTH_URL;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "flow-link.vercel.app";

    assert.equal(getAppUrl(), "https://flow-link.vercel.app");

    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;

    assert.equal(getAppUrl(), "http://localhost:3000");
  });
});
