import { z } from "zod";

export const SendMessageSchema = z.object({
  type: z.enum(["TEXT", "IMAGE", "FILE"]),
  content: z.string().max(5000).optional(),
  fileUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  fileName: z.string().max(255).optional(),
  fileSize: z.number().int().positive().optional(),
});

export type SendMessageInput = z.output<typeof SendMessageSchema>;

export const EditMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

export type EditMessageInput = z.output<typeof EditMessageSchema>;

export const MessagesQuerySchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type MessagesQueryInput = z.output<typeof MessagesQuerySchema>;
