import {
  createConversation,
  findConversationsByUserId,
  findConversationById,
  deleteConversation,
  findDirectConversationBetweenUsers,
  findMembership,
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
      id: m.user.id,
      displayName: m.user.displayName,
      avatarUrl: m.user.avatarUrl,
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
  const allMemberIds = [...new Set([...input.memberIds, userId])];

  if (input.type === "DIRECT") {
    const otherUserId = input.memberIds[0];
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
  const membership = await findMembership(id, userId);
  if (!membership) {
    return { error: "Conversation not found" as const, status: 404 };
  }

  const conversation = await findConversationById(id);
  if (!conversation) {
    return { error: "Conversation not found" as const, status: 404 };
  }

  return { conversation: formatConversation(conversation)! };
}

export async function removeConversation(id: string, userId: string) {
  const membership = await findMembership(id, userId);
  if (!membership) {
    return { error: "Conversation not found" as const, status: 404 };
  }

  await deleteConversation(id);
}
