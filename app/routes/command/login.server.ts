import type { ResWithInit } from "./route";
import type { Arguments } from "yargs-parser";
import type { ActionError } from "~/utils/actionhelper";
import type { SafeParseReturnType, ZodIssue } from "zod";
import type { ShareableUser } from "~/lib/auth/shareable.user";
import type { UserLoginForm } from "~/lib/auth/validation.auth.user.server";

import { UserRole } from "@prisma/client";
import parser from "~/lib/commands/index.server";
import { getAuthenticatedUser } from "~/lib/auth/auth.user.server";
import { userLoginSchema } from "~/lib/auth/validation.auth.user.server";

export default async function CMDLoginHandler({
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

  const loginData: UserLoginForm = loginDataParser(cmd);
  const parsedLoginData: SafeParseReturnType<UserLoginForm, UserLoginForm> =
    userLoginSchema.safeParse(loginData);
  if (!parsedLoginData.success) {
    return [
      {
        success: false,
        errors: [
          ...parsedLoginData.error.errors.map((err: ZodIssue): ActionError => {
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
  return [
    {
      success: true,
      data: {
        data: loginData,
        fetchForm: "/login",
        content: `logging in`,
      },
    },
  ];
}

function loginDataParser(cmd: string): UserLoginForm {
  const loginArgs: Arguments = parser(cmd, {
    string: ["email", "password"],
    alias: {
      email: ["e"],
      password: ["p", "pswd"],
    },
    default: {
      email: "",
      password: "",
    },
  });

  const loginData: UserLoginForm = {
    email: loginArgs.email || loginArgs._?.[1],
    password: loginArgs.password || loginArgs._?.[2],
  };

  return loginData;
}
