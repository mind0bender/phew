import type { ResWithInit } from "./route";
import type { Arguments } from "yargs-parser";
import type { ActionError } from "~/utils/actionhelper";
import type { SafeParseReturnType, ZodIssue } from "zod";
import type { ShareableUser } from "~/lib/auth/shareable.user";
import type { UserLoginForm } from "~/lib/auth/validation.auth.user.server";

import { ERR500 } from "~/lib/misc";
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
  try {
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
            ...parsedLoginData.error.errors.map(
              (err: ZodIssue): ActionError => {
                return {
                  message: err.message,
                  code: 400,
                };
              }
            ),
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
  } catch (error) {
    console.error(error);
    return ERR500();
  }
}

function loginDataParser(cmd: string): UserLoginForm {
  const loginArgs: Arguments = parser(cmd, {
    string: ["name", "password"],
    alias: {
      name: ["n", "user", "u"],
      password: ["p", "pswd"],
    },
    default: {
      name: "",
      password: "",
    },
  });

  const loginData: UserLoginForm = {
    name: loginArgs.name || loginArgs._?.[1],
    password: loginArgs.password || loginArgs._?.[2],
  };

  return loginData;
}
