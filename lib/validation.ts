import { z } from "zod"

export const LoginFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required"),
})

export type LoginFormData = z.output<typeof LoginFormSchema>

export const RegisterFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  displayName: z.string().min(1, "Display name is required").max(50),
})

export type RegisterFormData = z.output<typeof RegisterFormSchema>

export const MessageFormSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(5000),
})

export type MessageFormData = z.output<typeof MessageFormSchema>

export const CreateGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  memberIds: z.array(z.string()).min(1, "Select at least one member"),
})
