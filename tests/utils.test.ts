import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHAT_MESSAGE_CREATED_EVENT,
  getConversationChannelName,
} from "../src/lib/chat-realtime";
import { cn } from "../src/lib/utils";

describe("utility helpers", () => {
  it("joins only truthy class names in order", () => {
    assert.equal(cn("base", false, null, "active", undefined, "wide"), "base active wide");
  });

  it("uses the current realtime chat event and channel naming", () => {
    assert.equal(CHAT_MESSAGE_CREATED_EVENT, "message.created");
    assert.equal(getConversationChannelName("conversation-id"), "conversation:conversation-id");
  });
});
