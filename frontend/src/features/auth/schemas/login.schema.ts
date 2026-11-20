import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid business email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  rememberMe: z.boolean().default(false).optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
