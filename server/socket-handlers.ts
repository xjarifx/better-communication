import type { Server, Socket } from "socket.io";
import { findMembership } from "../modules/conversation/repository";
import {
  createMessage,
  findMessageById,
  updateMessage,
  deleteMessage,
} from "../modules/message/repository";
import type { AccessTokenPayload } from "../lib/jwt";

const TYPING_THROTTLE = 3000;
const typingTimers = new Map<string, number>();

function getUserId(socket: Socket): string {
  return (socket.data.user as AccessTokenPayload).userId;
}

export function registerHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    const userId = getUserId(socket);

    console.log(`[socket] User ${userId} connected, socket ID: ${socket.id}`);

    // Join user to their personal room for receiving notifications
    socket.join(`user:${userId}`);

    socket.on(
      "conversation:created",
      async (payload: { conversationId: string; otherUserIds: string[] }) => {
        console.log(`[conversation:created] Conversation ${payload.conversationId} created by ${userId}`);
        // Notify other users in the conversation that it was created
        for (const otherUserId of payload.otherUserIds) {
          io.to(`user:${otherUserId}`).emit("conversation:new", {
            conversationId: payload.conversationId,
            createdBy: userId,
          });
        }
      },
    );

    socket.on(
      "join:conversations",
      async (payload: { conversationIds: string[] }) => {
        const { conversationIds } = payload;
        
        console.log(`[join:conversations] User ${userId} joining ${conversationIds.length} conversations`);

        for (const conversationId of conversationIds) {
          const membership = await findMembership(conversationId, userId);
          if (membership) {
            await socket.join(`conversation:${conversationId}`);
            console.log(`[join:conversations] User ${userId} joined room conversation:${conversationId}`);
          } else {
            console.log(`[join:conversations] User ${userId} not a member of conversation ${conversationId}`);
          }
        }

        for (const conversationId of conversationIds) {
          io.to(`conversation:${conversationId}`).emit("user:online", {
            userId,
            online: true,
          });
        }
      },
    );

    socket.on(
      "conversation:join",
      async (payload: { conversationId: string }) => {
        const membership = await findMembership(payload.conversationId, userId);
        if (membership) {
          await socket.join(`conversation:${payload.conversationId}`);
        }
      },
    );

    socket.on("conversation:leave", (payload: { conversationId: string }) => {
      socket.leave(`conversation:${payload.conversationId}`);
    });

    socket.on(
      "message:send",
      async (
        payload: {
          conversationId: string;
          type: "TEXT" | "IMAGE" | "FILE";
          content?: string;
          fileUrl?: string;
          thumbnailUrl?: string;
          fileName?: string;
          fileSize?: number;
        },
        ack?: (response: {
          status: string;
          messageId?: string;
          error?: string;
        }) => void,
      ) => {
        try {
          console.log(`[message:send] User ${userId} sending message to ${payload.conversationId}`);
          const membership = await findMembership(
            payload.conversationId,
            userId,
          );
          if (!membership) {
            console.log(`[message:send] User ${userId} not a member of ${payload.conversationId}`);
            ack?.({ status: "error", error: "Forbidden" });
            return;
          }

           const message = await createMessage({
            conversationId: payload.conversationId,
            senderId: userId,
            type: payload.type,
            content: payload.content ?? null,
            fileUrl: payload.fileUrl ?? null,
            thumbnailUrl: payload.thumbnailUrl ?? null,
            fileName: payload.fileName ?? null,
            fileSize: payload.fileSize ?? null,
          });

          console.log(`[message:send] Message ${message.id} created, broadcasting to room conversation:${payload.conversationId}`);

          const fullMessage = {
            id: message.id,
            conversationId: message.conversationId,
            sender: {
              id: message.sender.id,
              displayName: message.sender.displayName,
              avatarUrl: message.sender.avatarUrl,
            },
            type: message.type,
            content: message.content,
            fileUrl: message.fileUrl,
            thumbnailUrl: message.thumbnailUrl,
            fileName: message.fileName,
            fileSize: message.fileSize,
            createdAt: message.createdAt.toISOString(),
          };

          // Broadcast to all users in the conversation (including the sender)
          io
            .to(`conversation:${payload.conversationId}`)
            .emit("message:new", fullMessage);
          
          console.log(`[message:send] Message ${message.id} broadcasted`);
          ack?.({ status: "ok", messageId: message.id });
        } catch (err) {
          ack?.({ status: "error", error: "Internal server error" });
        }
      },
    );

    socket.on(
      "message:edit",
      async (
        payload: { messageId: string; content: string },
        ack?: (response: {
          status: string;
          message?: unknown;
          error?: string;
        }) => void,
      ) => {
        try {
          const message = await findMessageById(payload.messageId);
          if (!message) {
            ack?.({ status: "error", error: "Message not found" });
            return;
          }
          if (message.senderId !== userId) {
            ack?.({ status: "error", error: "Forbidden" });
            return;
          }

          const updated = await updateMessage(payload.messageId, {
            content: payload.content,
          });

          const fullMessage = {
            id: updated.id,
            conversationId: updated.conversationId,
            sender: {
              id: updated.sender.id,
              displayName: updated.sender.displayName,
              avatarUrl: updated.sender.avatarUrl,
            },
            type: updated.type,
            content: updated.content,
            fileUrl: updated.fileUrl,
            thumbnailUrl: updated.thumbnailUrl,
            fileName: updated.fileName,
            fileSize: updated.fileSize,
            createdAt: updated.createdAt.toISOString(),
          };

          io.to(`conversation:${updated.conversationId}`).emit(
            "message:updated",
            fullMessage,
          );
          ack?.({ status: "ok", message: fullMessage });
        } catch (err) {
          ack?.({ status: "error", error: "Internal server error" });
        }
      },
    );

    socket.on(
      "message:delete",
      async (
        payload: { messageId: string },
        ack?: (response: { status: string; error?: string }) => void,
      ) => {
        try {
          const message = await findMessageById(payload.messageId);
          if (!message) {
            ack?.({ status: "error", error: "Message not found" });
            return;
          }
          if (message.senderId !== userId) {
            ack?.({ status: "error", error: "Forbidden" });
            return;
          }

          await deleteMessage(payload.messageId);

          io.to(`conversation:${message.conversationId}`).emit(
            "message:deleted",
            {
              messageId: payload.messageId,
              conversationId: message.conversationId,
            },
          );

          ack?.({ status: "ok" });
        } catch (err) {
          ack?.({ status: "error", error: "Internal server error" });
        }
      },
    );

    socket.on("user:typing", (payload: { conversationId: string }) => {
      const key = `${userId}:${payload.conversationId}`;
      const now = Date.now();
      const last = typingTimers.get(key) ?? 0;

      if (now - last >= TYPING_THROTTLE) {
        typingTimers.set(key, now);
        socket
          .to(`conversation:${payload.conversationId}`)
          .emit("user:typing", {
            userId,
            conversationId: payload.conversationId,
          });
      }
    });

    socket.on("user:stop-typing", (payload: { conversationId: string }) => {
      const key = `${userId}:${payload.conversationId}`;
      typingTimers.delete(key);
      socket
        .to(`conversation:${payload.conversationId}`)
        .emit("user:stop-typing", {
          userId,
          conversationId: payload.conversationId,
        });
    });

    socket.on(
      "call:start",
      (payload: { conversationId: string; roomUrl: string }) => {
        socket
          .to(`conversation:${payload.conversationId}`)
          .emit("call:incoming", {
            conversationId: payload.conversationId,
            roomUrl: payload.roomUrl,
            callerId: userId,
          });
      },
    );

    socket.on("call:end", (payload: { conversationId: string }) => {
      io.to(`conversation:${payload.conversationId}`).emit("call:ended", {
        conversationId: payload.conversationId,
      });
    });

    socket.on("disconnect", () => {
      console.log(`[socket] User ${userId} disconnected`);
      for (const room of socket.rooms) {
        if (room.startsWith("conversation:")) {
          io.to(room).emit("user:online", { userId, online: false });
        }
      }
    });
  });
}
