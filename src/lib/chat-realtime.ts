export const CHAT_MESSAGE_CREATED_EVENT = "message.created";

export function getConversationChannelName(conversationId: string) {
  return `conversation:${conversationId}`;
}
