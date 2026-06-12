import { NextResponse } from "next/server";
import { getAblyRest } from "@/lib/ably";
import { getConversationChannelName } from "@/lib/chat-realtime";
import { getConversationForUser } from "@/lib/messages";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const conversationId = new URL(request.url).searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
  }

  const conversation = await getConversationForUser(conversationId, user);
  if (!conversation) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const ably = getAblyRest();
  if (!ably) {
    return NextResponse.json({ error: "Ably is not configured" }, { status: 503 });
  }

  const channelName = getConversationChannelName(conversation.id);
  const tokenRequest = await ably.auth.createTokenRequest({
    clientId: user.id,
    capability: {
      [channelName]: ["subscribe"],
    },
    ttl: 60 * 60 * 1000,
  });

  return NextResponse.json(tokenRequest);
}
