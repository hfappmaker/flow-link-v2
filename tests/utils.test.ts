import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cn } from "../src/lib/utils";

describe("utility helpers", () => {
  it("joins only truthy class names in order", () => {
    assert.equal(cn("base", false, null, "active", undefined, "wide"), "base active wide");
  });
});
