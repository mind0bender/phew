import type { SafeParseReturnType } from "zod";
import type { User } from "@prisma/client";
import type { FormStrategyVerifyParams } from "remix-auth-form";
import type { UserLoginForm } from "./validation.auth.user.server";

import { db } from "~/utils/db.server";
import Password from "~/utils/pswd.server";
import { FormStrategy } from "remix-auth-form";
import { sessionStorage } from "./session.server";
import { Authenticator, AuthorizationError } from "remix-auth";
import { userLoginSchema } from "./validation.auth.user.server";
import { ShareableUser } from "./shareable.user";
import { DEFAULT_USER } from "../constants";

export type UserSession = Pick<User, "user_id">;

const userAuthenticator = new Authenticator<UserSession>(sessionStorage);

const userAuthFormStrategy = new FormStrategy(async function ({
  form,
}: FormStrategyVerifyParams): Promise<UserSession> {
  const data: Record<string, FormDataEntryValue> = Object.fromEntries(form);
  const parsedData: SafeParseReturnType<UserLoginForm, UserLoginForm> =
    userLoginSchema.safeParse(data);
  if (parsedData.success) {
    const { name, password } = parsedData.data;
    const user: Omit<User, "updatedAt"> | null = await db.user.findUnique({
      where: {
        name,
      },
      select: {
        name: true,
        role: true,
        salt: true,
        email: true,
        user_id: true,
        password: true,
        createdAt: true,
      },
    });
    if (user) {
      const pswd: Password = new Password(password, user.salt);
      const isCorrectPSWD: boolean = await pswd.compare(user.password);
      if (isCorrectPSWD) {
        return {
          user_id: user.user_id,
        };
      } else {
        throw new AuthorizationError("Incorrect password");
      }
    } else {
      throw new AuthorizationError("User not found");
    }
  } else {
    throw new AuthorizationError("Invalid Input", parsedData.error);
  }
});

interface GetAuthenticatedUserArgs {
  request: Request;
}

export async function getAuthenticatedUser({
  request,
}: GetAuthenticatedUserArgs): Promise<ShareableUser> {
  const userSession: UserSession | null =
    await userAuthenticator.isAuthenticated(request);
  if (userSession) {
    const user: User | null = await db.user.findUnique({
      where: {
        user_id: userSession.user_id,
      },
    });
    if (user) {
      return new ShareableUser(user);
    } else {
      return DEFAULT_USER;
    }
  } else {
    return DEFAULT_USER;
  }
}

userAuthenticator.use(userAuthFormStrategy, "form");

export default userAuthenticator;
