import type { ResWithInit } from "./route";
import type { Arguments } from "yargs-parser";
import type { ActionError } from "~/utils/actionhelper";
import type { SafeParseReturnType, ZodIssue } from "zod";
import type { ShareableUser } from "~/lib/auth/shareable.user";
import type { UserSignupForm } from "~/lib/auth/validation.auth.user.server";

import { UserRole } from "@prisma/client";
import parser from "~/lib/commands/index.server";
import { getAuthenticatedUser } from "~/lib/auth/auth.user.server";
import { userSignupSchema } from "~/lib/auth/validation.auth.user.server";

export default async function CMDSignupHandler({
  request,
  cmd,
}: {
  request: Request;
  cmd: string;
}): Promise<ResWithInit> {
  const reqForAuth: Request = request.clone();
  const user: ShareableUser = await getAuthenticatedUser({
    request: reqForAuth,
  });
  if (user.role !== UserRole.STEM) {
    return [
      {
        success: true,
        data: {
          content: `currently logged in as ${user.name}
logout to continue`,
        },
      },
    ];
  }

  const signupData: UserSignupForm = signupDataParser(cmd);
  const parsedSignupData: SafeParseReturnType<UserSignupForm, UserSignupForm> =
    userSignupSchema.safeParse(signupData);
  if (parsedSignupData.success) {
    return [
      {
        success: true,
        data: {
          data: signupData,
          fetchForm: "/signup",
          content: `signing up`,
        },
      },
    ];
  } else {
    return [
      {
        success: false,
        errors: [
          ...parsedSignupData.error.errors.map((err: ZodIssue): ActionError => {
            return {
              message: err.message,
              code: 400,
            };
          }),
        ],
      },
      {
        status: 400,
      },
    ];
  }
}

function signupDataParser(cmd: string): UserSignupForm {
  const signupArgs: Arguments = parser(cmd, {
    string: ["name", "email", "password"],
    alias: {
      name: ["n", "user", "u"],
      password: ["p", "pswd"],
      email: ["e"],
    },
    default: {
      name: "",
      email: "",
      password: "",
    },
  });

  const signupData: UserSignupForm = {
    name: signupArgs.name || signupArgs._?.[1],
    email: signupArgs.email || signupArgs._?.[2],
    password: signupArgs.password || signupArgs._?.[3],
  };

  return signupData;
}
