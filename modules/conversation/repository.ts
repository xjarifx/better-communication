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
        select: { content: true, senderId: true, createdAt: true },
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

export async function countUnreadMessages(
  conversationId: string,
  lastReadAt: Date,
) {
  return prisma.message.count({
    where: {
      conversationId,
      createdAt: { gt: lastReadAt },
    },
  });
}

export async function countUnreadMessagesBatch(
  userId: string,
  conversationIds: string[],
): Promise<Map<string, number>> {
  if (conversationIds.length === 0) return new Map();

  type Row = { conversationId: string; count: bigint };
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT cm."conversationId", COUNT(m.id)::int AS count
    FROM "conversation_members" cm
    LEFT JOIN "messages" m
      ON m."conversationId" = cm."conversationId"
      AND m."createdAt" > cm."lastReadAt"
    WHERE cm."userId" = ${userId}
      AND cm."conversationId" IN (${Prisma.join(conversationIds)})
    GROUP BY cm."conversationId"
  `;

  return new Map(rows.map((r) => [r.conversationId, Number(r.count)]));
}
