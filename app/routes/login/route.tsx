import type {
  ActionArgs,
  LoaderArgs,
  Session,
  TypedResponse,
} from "@remix-run/node";
import type { User } from "@prisma/client";
import type { SafeParseReturnType, ZodIssue } from "zod";
import type { CMDResponse } from "~/routes/command/route";
import type { UserSession } from "~/lib/auth/auth.user.server";
import type { ActionError, ActionReturnType } from "~/utils/actionhelper";
import type { ShareableUserSelectedType } from "~/lib/auth/shareable.user";
import type { UserLoginForm } from "~/lib/auth/validation.auth.user.server";

import userAuthenticator, {
  getAuthenticatedUser,
} from "~/lib/auth/auth.user.server";
import { db } from "~/utils/db.server";
import { json } from "@remix-run/node";
import Password from "~/utils/pswd.server";
import { DEFAULT_USER } from "~/lib/constants";
import { commitSession, getSession } from "~/lib/auth/session.server";
import { userLoginSchema } from "~/lib/auth/validation.auth.user.server";
import { ShareableUser, ShareableUserSelect } from "~/lib/auth/shareable.user";

export async function loader({ request }: LoaderArgs) {
  try {
    const user: ShareableUser =
      (await getAuthenticatedUser({ request })) || DEFAULT_USER;
    return json<{ user: ShareableUser }>({ user });
  } catch (error) {
    console.error(error);
  }
}

export async function action({
  request,
}: ActionArgs): Promise<TypedResponse<CMDResponse>> {
  try {
    const authReq: Request = request.clone();
    const formData: FormData = await request.formData();
    const data: Record<string, FormDataEntryValue> =
      Object.fromEntries(formData);
    const parsed: SafeParseReturnType<UserLoginForm, UserLoginForm> =
      userLoginSchema.safeParse(data);
    if (!parsed.success) {
      return json<ActionReturnType>(
        {
          success: false,
          data: {
            content: ``,
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
    const { name, password } = parsed.data;
    console.log({ password, name });
    const user:
      | (ShareableUserSelectedType & Pick<User, "password" | "salt">)
      | null = await db.user.findUnique({
      where: {
        name,
      },
      select: { ...ShareableUserSelect, password: true, salt: true },
    });

    if (!user) {
      return json<ActionReturnType>(
        {
          success: false,
          data: {
            content: "",
            fetchForm: true,
          },
          errors: [
            {
              message: "User not found",
              code: 404,
            },
          ],
        },
        404
      );
    }
    const pswd: Password = new Password(password, user.salt);
    const isPasswordCorrect: boolean = await pswd.compare(user.password);
    if (!isPasswordCorrect) {
      return json<ActionReturnType>(
        {
          success: false,
          data: {
            content: "",
            fetchForm: true,
          },
          errors: [
            {
              message: `Authentication Error: User identification failed
Access denied.`,
              code: 401,
            },
          ],
        },
        401
      );
    }
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
          content: `User identified: ${user.name}
Logged in at   : ${new Date().toLocaleString()}
Authorization confirmed.`,
          data: { user: new ShareableUser(user) },
          fetchForm: true,
          updateUser: true,
        },
      },
      {
        headers,
      }
    );
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
