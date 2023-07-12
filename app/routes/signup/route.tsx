import type { Folder, User } from "@prisma/client";
import type { SafeParseReturnType, ZodIssue } from "zod";
import type { CMDResponse } from "~/routes/command/route";
import type { HashedPassword } from "~/utils/pswd.server";
import type { UserSession } from "~/lib/auth/auth.user.server";
import type { ActionError, ActionReturnType } from "~/utils/actionhelper";
import type { ActionArgs, Session, TypedResponse } from "@remix-run/node";
import type { UserSignupForm } from "~/lib/auth/validation.auth.user.server";

import { db } from "~/utils/db.server";
import { json } from "@remix-run/node";
import Password from "~/utils/pswd.server";
import { signJWT } from "~/lib/auth/jwt.server";
import { ShareableUser } from "~/lib/auth/shareable.user";
import userAuthenticator from "~/lib/auth/auth.user.server";
import { commitSession, getSession } from "~/lib/auth/session.server";
import { userSignupSchema } from "~/lib/auth/validation.auth.user.server";
import sendVerificationEmail from "~/lib/mail/email_verification.mailer.server";

export async function action({
  request,
}: ActionArgs): Promise<TypedResponse<CMDResponse>> {
  try {
    const authReq: Request = request.clone();
    const formData: FormData = await request.formData();
    const data: Record<string, FormDataEntryValue> =
      Object.fromEntries(formData);
    const parsed: SafeParseReturnType<UserSignupForm, UserSignupForm> =
      userSignupSchema.safeParse(data);
    if (parsed.success) {
      const { name, email, password } = parsed.data;
      console.log({ password, name });
      const exists = await db.user.findFirst({
        where: {
          OR: [{ email }, { name }],
        },
        select: {
          name: true,
        },
      });
      if (!exists) {
        const pswd: Password = new Password(password);
        const { hash, salt }: HashedPassword = await pswd.hash();
        const user: Pick<
          User,
          "name" | "email" | "user_id" | "role" | "createdAt" | "isVerified"
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
            isVerified: true,
          },
        });

        const token: string = signJWT(user.user_id);

        await sendVerificationEmail({
          to: user.email,
          username: user.name,
          token,
        });

        // create root directory for the user
        const rootDir: Pick<Folder, "folder_id" | "name"> =
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
            name: `/source`,
            user_id: user.user_id,
            parent_folder_id: rootDir.folder_id,
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
              content: `signed up as ${user.name}
at ${new Date().toUTCString()}

We've sent a verification email to ${user.email}`,
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
        if (name === exists.name) {
          return json<ActionReturnType>(
            {
              success: false,
              data: {
                content: "",
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
        } else {
          return json<ActionReturnType>(
            {
              success: false,
              data: {
                content: "",
                fetchForm: true,
              },
              errors: [
                {
                  message: `email: ${email} is registered with another user`,
                  code: 309,
                },
              ],
            },
            309
          );
        }
      }
    } else {
      return json<ActionReturnType>(
        {
          success: false,
          data: {
            content: "",
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
  } catch (error) {
    console.error(error);
    return json<ActionReturnType>(
      {
        success: false,
        data: {
          content: "",
          fetchForm: true,
        },
        errors: [
          {
            message: `Internal server error`,
            code: 500,
          },
        ],
      },
      500
    );
  }
}
