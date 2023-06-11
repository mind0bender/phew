import { z } from "zod";

export const userSignupSchema = z.object({
  name: z
    .string({ required_error: "username is required" })
    .min(3, "name must be at least 3 characters")
    .max(30, "name must be at most 30 characters"),
  email: z
    .string({
      required_error: "email is required",
    })
    .email(),
  password: z
    .string({
      required_error: "password is required",
    })
    .min(8, "password must be at least 8 characters")
    .max(30, "password must be at most 30 characters"),
});

export type UserSignupForm = z.infer<typeof userSignupSchema>;

export const userLoginSchema = z.object({
  name: userSignupSchema.shape.name,
  password: userSignupSchema.shape.password,
});

export type UserLoginForm = z.infer<typeof userLoginSchema>;
