import { prisma } from "../../lib/prisma";
import { Prisma } from "@prisma/client";
import type { $Enums } from "@prisma/client";

export async function findConversationsByUserId(userId: string) {
  return prisma.conversation.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, content: true, senderId: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function findConversationById(id: string) {
  return prisma.conversation.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      },
    },
  });
}

export async function createConversation(data: {
  type: $Enums.ConversationType;
  name?: string;
  memberIds: string[];
}) {
  return prisma.conversation.create({
    data: {
      type: data.type,
      name: data.name,
      members: {
        create: data.memberIds.map((userId) => ({ userId })),
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      },
    },
  });
}

export async function deleteConversation(id: string) {
  return prisma.conversation.delete({ where: { id } });
}

export async function findDirectConversationBetweenUsers(
  user1Id: string,
  user2Id: string,
) {
  return prisma.conversation.findFirst({
    where: {
      type: "DIRECT",
      AND: [
        { members: { some: { userId: user1Id } } },
        { members: { some: { userId: user2Id } } },
      ],
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      },
    },
  });
}

export async function findMembership(conversationId: string, userId: string) {
  return prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });
}

export async function addMembers(conversationId: string, memberIds: string[]) {
  await prisma.conversationMember.createMany({
    data: memberIds.map((userId) => ({ conversationId, userId })),
    skipDuplicates: true,
  });
  return findConversationById(conversationId);
}

export async function removeMember(conversationId: string, userId: string) {
  await prisma.conversationMember.delete({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });
}


