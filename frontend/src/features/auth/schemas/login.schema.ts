import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Please enter your registered mobile number or business email")
    .refine(
      (val) => {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        const isPhone = /^[0-9+()-\s]{10,20}$/.test(val);
        return isEmail || isPhone;
      },
      {
        message: "Enter a valid 10-digit mobile number or business email address",
      }
    ),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  rememberMe: z.boolean().default(false).optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

