import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(50),
});

export type RegisterInput = z.output<typeof RegisterSchema>;
