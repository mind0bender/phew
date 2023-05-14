import { z } from "zod";

export const userSignupSchema = z.object({
  name: z
    .string()
    .min(3, "name must be at least 3 characters")
    .max(30, "name must be at most 30 characters"),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "password must be at least 8 characters")
    .max(30, "password must be at most 30 characters"),
});

export type UserSignupForm = z.infer<typeof userSignupSchema>;

export const userLoginSchema = z.object({
  email: userSignupSchema.shape.email,
  password: userSignupSchema.shape.password,
});

export type UserLoginForm = z.infer<typeof userLoginSchema>;
