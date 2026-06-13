import { z } from "zod"

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Use 8+ characters with a number and a symbol")
      .regex(/\d/, "Use 8+ characters with a number and a symbol")
      .regex(/[^A-Za-z0-9]/, "Use 8+ characters with a number and a symbol"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type ResetPasswordCredentials = z.infer<typeof resetPasswordSchema>
