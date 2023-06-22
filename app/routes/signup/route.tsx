import type { Folder, User } from "@prisma/client";
import type { SafeParseReturnType, ZodIssue } from "zod";
import type { HashedPassword } from "~/utils/pswd.server";
import type { UserSession } from "~/lib/auth/auth.user.server";
import type { ActionError, ActionReturnType } from "~/utils/actionhelper";
import type { ActionArgs, Session, TypedResponse } from "@remix-run/node";
import type { UserSignupForm } from "~/lib/auth/validation.auth.user.server";

import { db } from "~/utils/db.server";
import { json } from "@remix-run/node";
import Password from "~/utils/pswd.server";
import type { CMDResponse } from "../command/route";
import { ShareableUser } from "~/lib/auth/shareable.user";
import userAuthenticator from "~/lib/auth/auth.user.server";
import { commitSession, getSession } from "~/lib/auth/session.server";
import { userSignupSchema } from "~/lib/auth/validation.auth.user.server";

export async function action({
  request,
}: ActionArgs): Promise<TypedResponse<CMDResponse>> {
  const authReq: Request = request.clone();
  const formData: FormData = await request.formData();
  const data: Record<string, FormDataEntryValue> = Object.fromEntries(formData);
  const parsed: SafeParseReturnType<UserSignupForm, UserSignupForm> =
    userSignupSchema.safeParse(data);
  if (parsed.success) {
    const { name, email, password } = parsed.data;
    console.log({ password, name });
    const exists: boolean = Boolean(
      await db.user.findFirst({
        where: {
          OR: [{ email }, { name }],
        },
        select: {
          name: true,
        },
      })
    );
    if (!exists) {
      const pswd: Password = new Password(password);
      const { hash, salt }: HashedPassword = await pswd.hash();
      const user: Pick<
        User,
        "name" | "email" | "user_id" | "role" | "createdAt"
      > = await db.user.create({
        data: {
          name,
          email,
          password: hash,
          salt,
        },
        select: {
          name: true,
          user_id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      // create root directory for the user
      const rootFolder: Pick<Folder, "folder_id" | "name"> =
        await db.folder.create({
          data: {
            name: "/",
            user_id: user.user_id,
          },
          select: {
            folder_id: true,
            name: true,
          },
        });

      // create /source directory for the user
      await db.folder.create({
        data: {
          name: `${rootFolder.name}source`,
          user_id: user.user_id,
          parent_folder_id: rootFolder.folder_id,
        },
        select: {
          folder_id: true,
        },
      });

      const userSession: UserSession = await userAuthenticator.authenticate(
        "form",
        authReq
      );
      const session: Session = await getSession(request);
      session.set(userAuthenticator.sessionKey, userSession);

      const headers: Headers = new Headers({
        "Set-Cookie": await commitSession(session),
      });
      return json<CMDResponse>(
        {
          success: true,
          data: {
            content: `signedup as ${user.name} at ${Date.now()}`,
            data: { user: new ShareableUser(user) },
            fetchForm: true,
            updateUser: true,
          },
        },
        {
          status: 201,
          headers,
        }
      );
    } else {
      return json<ActionReturnType>(
        {
          success: false,
          data: {
            fetchForm: true,
          },
          errors: [
            {
              message: `username: ${name} has been secured by another user`,
              code: 309,
            },
          ],
        },
        309
      );
    }
  } else {
    return json<ActionReturnType>(
      {
        success: false,
        data: {
          fetchForm: true,
        },
        errors: [
          ...parsed.error.errors.map((err: ZodIssue): ActionError => {
            return {
              message: err.message,
              code: 400,
            };
          }),
        ],
      },
      400
    );
  }
}
