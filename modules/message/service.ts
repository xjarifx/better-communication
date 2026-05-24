import { findMembership } from "../conversation/repository";
import {
  findMessagesByConversationId,
  createMessage,
  findMessageById,
  updateMessage,
  deleteMessage,
} from "./repository";
import type { SendMessageInput, EditMessageInput, MessagesQueryInput } from "./schema";

function formatMessage(msg: Awaited<ReturnType<typeof createMessage>>) {
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    sender: {
      id: msg.sender.id,
      displayName: msg.sender.displayName,
      avatarUrl: msg.sender.avatarUrl,
    },
    type: msg.type,
    content: msg.content,
    fileUrl: msg.fileUrl,
    thumbnailUrl: msg.thumbnailUrl,
    fileName: msg.fileName,
    fileSize: msg.fileSize,
    createdAt: msg.createdAt.toISOString(),
  };
}

export async function listMessages(
  conversationId: string,
  userId: string,
  query: MessagesQueryInput,
) {
  const membership = await findMembership(conversationId, userId);
  if (!membership) {
    return { error: "Forbidden" as const, status: 403 };
  }

  const { messages, nextCursor } = await findMessagesByConversationId(
    conversationId,
    query.limit,
    query.cursor,
  );

  return {
    messages: messages.map(formatMessage),
    nextCursor,
  };
}

export async function sendMessage(
  conversationId: string,
  userId: string,
  input: SendMessageInput,
) {
  const membership = await findMembership(conversationId, userId);
  if (!membership) {
    return { error: "Forbidden" as const, status: 403 };
  }

  const message = await createMessage({
    conversationId,
    senderId: userId,
    type: input.type,
    content: input.content ?? null,
    fileUrl: input.fileUrl ?? null,
    thumbnailUrl: input.thumbnailUrl ?? null,
    fileName: input.fileName ?? null,
    fileSize: input.fileSize ?? null,
  });

  return { message: formatMessage(message) };
}

export async function editMessage(
  messageId: string,
  userId: string,
  input: EditMessageInput,
) {
  const message = await findMessageById(messageId);
  if (!message) {
    return { error: "Message not found" as const, status: 404 };
  }
  if (message.senderId !== userId) {
    return { error: "Forbidden" as const, status: 403 };
  }

  const updated = await updateMessage(messageId, { content: input.content });
  return { message: formatMessage(updated) };
}

export async function removeMessage(messageId: string, userId: string) {
  const message = await findMessageById(messageId);
  if (!message) {
    return { error: "Message not found" as const, status: 404 };
  }
  if (message.senderId !== userId) {
    return { error: "Forbidden" as const, status: 403 };
  }

  await deleteMessage(messageId);
}
