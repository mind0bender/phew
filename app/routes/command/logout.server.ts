import type { ResWithInit } from "./route";
import type { Session } from "@remix-run/node";
import type { ShareableUser } from "~/lib/auth/shareable.user";

import userAuthenticator, {
  getAuthenticatedUser,
} from "~/lib/auth/auth.user.server";
import { UserRole } from "@prisma/client";
import { ERR500, loginRequiredMsg } from "~/lib/misc";
import { commitSession, getSession } from "~/lib/auth/session.server";

export default async function CMDLogoutHandler({
  request,
}: {
  request: Request;
}): Promise<ResWithInit> {
  try {
    const reqForAuth: Request = request.clone();
    const user: ShareableUser = await getAuthenticatedUser({
      request: reqForAuth,
    });
    if (user.role === UserRole.STEM) {
      return [
        {
          success: false,
          errors: [{ message: loginRequiredMsg, code: 401 }],
        },
        {
          status: 401,
        },
      ];
    }

    const session: Session = await getSession(request);
    session.set(userAuthenticator.sessionKey, "");

    const headers: Headers = new Headers({
      "Set-Cookie": await commitSession(session),
    });

    return [
      {
        success: true,
        data: {
          content: `Logged out of ${user.name}`,
          updateUser: true,
        },
      },
      {
        headers,
      },
    ];
  } catch (error) {
    console.error(error);
    return ERR500();
  }
}
