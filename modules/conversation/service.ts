import { prisma } from "../../lib/prisma";
import {
  createConversation,
  findConversationsByUserId,
  findConversationById,
  deleteConversation,
  findDirectConversationBetweenUsers,
  countUnreadMessagesBatch,
} from "./repository";
import type { CreateConversationInput } from "./schema";

function formatConversation(
  conv: Awaited<ReturnType<typeof findConversationById>>,
) {
  if (!conv) return null;
  return {
    id: conv.id,
    type: conv.type,
    name: conv.name,
    members: conv.members.map((m) => ({
      id: m.user?.id ?? "",
      displayName: m.user?.displayName ?? "Unknown User",
      avatarUrl: m.user?.avatarUrl ?? null,
    })),
    createdAt: conv.createdAt.toISOString(),
    updatedAt: conv.updatedAt.toISOString(),
  };
}

export async function listConversations(userId: string) {
  const conversations = await findConversationsByUserId(userId);

  const conversationIds = conversations.map((c) => c.id);
  const unreadCounts = await countUnreadMessagesBatch(userId, conversationIds);

  return conversations.map((conv) => {
    const member = conv.members.find((m) => m.userId === userId)!;
    const unreadCount = unreadCounts.get(conv.id) ?? 0;

    return {
      id: conv.id,
      type: conv.type,
      name: conv.name,
      members: conv.members.map((m) => ({
        id: m.user.id,
        displayName: m.user.displayName,
        avatarUrl: m.user.avatarUrl,
      })),
      lastMessage: conv.messages[0]
        ? {
            id: conv.messages[0].id,
            content: conv.messages[0].content,
            senderId: conv.messages[0].senderId,
            createdAt: conv.messages[0].createdAt.toISOString(),
          }
        : null,
      unreadCount,
      updatedAt: conv.updatedAt.toISOString(),
    };
  });
}

export async function createConversationForUser(
  input: CreateConversationInput,
  userId: string,
) {
  const users = await prisma.user.findMany({
    where: { email: { in: input.memberIds } },
    select: { id: true, email: true },
  });

  if (users.length !== input.memberIds.length) {
    const found = new Set(users.map((u) => u.email));
    const missing = input.memberIds.filter((e) => !found.has(e));
    return { error: `Users not found: ${missing.join(", ")}` as const, status: 404 };
  }

  const resolvedMemberIds = users.map((u) => u.id);
  const allMemberIds = [...new Set([...resolvedMemberIds, userId])];

  if (input.type === "DIRECT") {
    const otherUserId = resolvedMemberIds[0];
    const existing = await findDirectConversationBetweenUsers(
      userId,
      otherUserId,
    );
    if (existing) {
      return {
        conversation: formatConversation(existing)!,
        isNew: false as const,
      };
    }
  }

  const conversation = await createConversation({
    type: input.type,
    name: input.name,
    memberIds: allMemberIds,
  });

  return {
    conversation: formatConversation(conversation)!,
    isNew: true as const,
  };
}

export async function getConversation(id: string, userId: string) {
  const conversation = await findConversationById(id);
  if (!conversation) {
    return { error: "Conversation not found" as const, status: 404 };
  }

  const membership = conversation.members.find((m) => m.userId === userId);
  if (!membership) {
    return { error: "Forbidden" as const, status: 403 };
  }

  return { conversation: formatConversation(conversation)! };
}

export async function removeConversation(id: string, userId: string) {
  const conversation = await findConversationById(id);
  if (!conversation) {
    return { error: "Conversation not found" as const, status: 404 };
  }

  const membership = conversation.members.find((m) => m.userId === userId);
  if (!membership) {
    return { error: "Forbidden" as const, status: 403 };
  }

  await deleteConversation(id);
}
