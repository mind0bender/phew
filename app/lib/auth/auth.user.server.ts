import type { User } from "@prisma/client";
import type { SafeParseReturnType } from "zod";
import type { FormStrategyVerifyParams } from "remix-auth-form";
import type { UserLoginForm } from "~/lib/auth/validation.auth.user.server";

import { db } from "~/utils/db.server";
import Password from "~/utils/pswd.server";
import { DEFAULT_USER } from "~/lib/constants";
import { FormStrategy } from "remix-auth-form";
import { ShareableUser } from "~/lib/auth/shareable.user";
import { sessionStorage } from "~/lib/auth/session.server";
import { Authenticator, AuthorizationError } from "remix-auth";
import { userLoginSchema } from "~/lib/auth/validation.auth.user.server";

export type UserSession = Pick<User, "user_id">;

const userAuthenticator = new Authenticator<UserSession>(sessionStorage);

const userAuthFormStrategy = new FormStrategy(async function ({
  form,
}: FormStrategyVerifyParams): Promise<UserSession> {
  try {
    const data: Record<string, FormDataEntryValue> = Object.fromEntries(form);
    const parsedData: SafeParseReturnType<UserLoginForm, UserLoginForm> =
      userLoginSchema.safeParse(data);
    if (parsedData.success) {
      const { name, password } = parsedData.data;
      const user: Pick<User, "role" | "salt" | "password" | "user_id"> | null =
        await db.user.findUnique({
          where: {
            name,
          },
          select: {
            role: true,
            salt: true,
            user_id: true,
            password: true,
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
  } catch (error) {
    console.error(error);
    throw error;
  }
});

interface GetAuthenticatedUserArgs {
  request: Request;
}

export async function getAuthenticatedUser({
  request,
}: GetAuthenticatedUserArgs): Promise<ShareableUser> {
  try {
    const userSession: UserSession | null =
      await userAuthenticator.isAuthenticated(request);
    if (userSession) {
      const user: Pick<
        User,
        "user_id" | "name" | "email" | "role" | "createdAt" | "isVerified"
      > | null = await db.user.findUnique({
        where: {
          user_id: userSession.user_id,
        },
        select: {
          name: true,
          email: true,
          role: true,
          user_id: true,
          createdAt: true,
          isVerified: true,
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
  } catch (error) {
    console.error(error);
    throw error;
  }
}

userAuthenticator.use(userAuthFormStrategy, "form");

export default userAuthenticator;
