import { prisma } from "../../lib/prisma";
import type { $Enums } from "@prisma/client";

const messageInclude = {
  sender: {
    select: { id: true, displayName: true, avatarUrl: true },
  },
} as const;

export async function findMessagesByConversationId(
  conversationId: string,
  limit: number,
  cursor?: string,
) {
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: messageInclude,
  });

  const hasMore = messages.length > limit;
  const items = hasMore ? messages.slice(0, limit) : messages;

  return {
    messages: items.reverse(),
    nextCursor: hasMore
      ? items[items.length - 1]!.createdAt.toISOString()
      : null,
  };
}

export async function createMessage(data: {
  conversationId: string;
  senderId: string;
  type: $Enums.MessageType;
  content?: string | null;
  fileUrl?: string | null;
  thumbnailUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
}) {
  return prisma.message.create({
    data,
    include: messageInclude,
  });
}

export async function findMessageById(id: string) {
  return prisma.message.findUnique({
    where: { id },
    include: messageInclude,
  });
}

export async function updateMessage(id: string, data: { content: string }) {
  return prisma.message.update({
    where: { id },
    data,
    include: messageInclude,
  });
}

export async function deleteMessage(id: string) {
  await prisma.message.delete({ where: { id } });
}
