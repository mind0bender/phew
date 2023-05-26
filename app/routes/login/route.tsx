import type { User } from "@prisma/client";
import type { LoaderArgs } from "@remix-run/node";
import type { CMDResponse } from "../command/route";
import type { SafeParseReturnType, ZodIssue } from "zod";
import type { UserSession } from "~/lib/auth/auth.user.server";
import type { ActionError, ActionReturnType } from "~/utils/actionhelper";
import type { ActionArgs, Session, TypedResponse } from "@remix-run/node";
import type { UserLoginForm } from "~/lib/auth/validation.auth.user.server";

import { db } from "~/utils/db.server";
import { json } from "@remix-run/node";
import Password from "~/utils/pswd.server";
import { DEFAULT_USER } from "~/lib/constants";
import { ShareableUser } from "~/lib/auth/shareable.user";
import { commitSession, getSession } from "~/lib/auth/session.server";
import { userLoginSchema } from "~/lib/auth/validation.auth.user.server";
import userAuthenticator, {
  getAuthenticatedUser,
} from "~/lib/auth/auth.user.server";

export async function loader({ request }: LoaderArgs) {
  let user: ShareableUser =
    (await getAuthenticatedUser({ request })) || DEFAULT_USER;
  return json({ user });
}

export async function action({
  request,
}: ActionArgs): Promise<TypedResponse<CMDResponse>> {
  const authReq: Request = request.clone();
  const formData: FormData = await request.formData();
  const data: Record<string, FormDataEntryValue> = Object.fromEntries(formData);
  const parsed: SafeParseReturnType<UserLoginForm, UserLoginForm> =
    userLoginSchema.safeParse(data);
  if (!parsed.success) {
    return json<ActionReturnType>(
      {
        success: false,
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
  const { email, password } = parsed.data;
  console.log({ password, email });
  const user: User | null = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return json<ActionReturnType>(
      {
        success: false,
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
Logged in at: ${Date.now()}
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
}
