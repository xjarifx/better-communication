import { z } from "zod";

export const CreateConversationSchema = z
  .object({
    type: z.enum(["DIRECT", "GROUP"]),
    name: z.string().min(1).max(100).optional(),
    memberIds: z.array(z.string()).min(1),
  })
  .superRefine((data, ctx) => {
    if (data.type === "DIRECT" && data.memberIds.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DIRECT conversations must have exactly 1 other member",
        path: ["memberIds"],
      });
    }
    if (data.type === "GROUP" && !data.name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "GROUP conversations require a name",
        path: ["name"],
      });
    }
  });

export type CreateConversationInput = z.output<typeof CreateConversationSchema>;
