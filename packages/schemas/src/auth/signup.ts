import { z } from "zod"

export const signupSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Use 8+ characters with a number and a symbol")
    .regex(/\d/, "Use 8+ characters with a number and a symbol")
    .regex(/[^A-Za-z0-9]/, "Use 8+ characters with a number and a symbol"),
  agreeToTerms: z
    .boolean()
    .refine((value) => value, "You must agree to the Terms and Privacy Policy"),
})

export type SignupCredentials = z.infer<typeof signupSchema>
