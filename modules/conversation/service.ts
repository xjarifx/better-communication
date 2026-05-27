import { prisma } from "../../lib/prisma";
import {
  createConversation,
  findConversationsByUserId,
  findConversationById,
  deleteConversation,
  findDirectConversationBetweenUsers,
  addMembers as repoAddMembers,
  removeMember as repoRemoveMember,
} from "./repository";
import type { CreateConversationInput, AddMembersInput } from "./schema";

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

  return conversations.map((conv) => {
    const member = conv.members.find((m) => m.userId === userId)!;

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
      updatedAt: conv.updatedAt.toISOString(),
    };
  });
}

export async function createConversationForUser(
  input: CreateConversationInput,
  userId: string,
) {
  const users = await prisma.user.findMany({
    where: { id: { in: input.memberIds } },
    select: { id: true },
  });

  if (users.length !== input.memberIds.length) {
    const found = new Set(users.map((u) => u.id));
    const missing = input.memberIds.filter((id) => !found.has(id));
    return { error: `Users not found: ${missing.join(", ")}` as const, status: 404 };
  }

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

export async function addMembersToConversation(
  conversationId: string,
  input: AddMembersInput,
  userId: string,
) {
  const conversation = await findConversationById(conversationId);
  if (!conversation) {
    return { error: "Conversation not found" as const, status: 404 };
  }
  if (conversation.type !== "GROUP") {
    return { error: "Can only add members to GROUP conversations" as const, status: 400 };
  }

  const membership = conversation.members.find((m) => m.userId === userId);
  if (!membership) {
    return { error: "Forbidden" as const, status: 403 };
  }

  const users = await prisma.user.findMany({
    where: { id: { in: input.memberIds } },
    select: { id: true },
  });

  if (users.length !== input.memberIds.length) {
    const found = new Set(users.map((u) => u.id));
    const missing = input.memberIds.filter((id) => !found.has(id));
    return { error: `Users not found: ${missing.join(", ")}` as const, status: 404 };
  }

  const updated = await repoAddMembers(conversationId, input.memberIds);
  return { conversation: formatConversation(updated)! };
}

export async function removeMemberFromConversation(
  conversationId: string,
  targetUserId: string,
  userId: string,
) {
  const conversation = await findConversationById(conversationId);
  if (!conversation) {
    return { error: "Conversation not found" as const, status: 404 };
  }
  if (conversation.type !== "GROUP") {
    return { error: "Can only remove members from GROUP conversations" as const, status: 400 };
  }

  const membership = conversation.members.find((m) => m.userId === userId);
  if (!membership) {
    return { error: "Forbidden" as const, status: 403 };
  }

  const targetMembership = conversation.members.find((m) => m.userId === targetUserId);
  if (!targetMembership) {
    return { error: "User is not a member of this conversation" as const, status: 404 };
  }

  await repoRemoveMember(conversationId, targetUserId);
}
