import type { ResWithInit } from "./route";
import type { ShareableUser } from "~/lib/auth/shareable.user";
import type { Session } from "@remix-run/node";

import { UserRole } from "@prisma/client";
import { commitSession, getSession } from "~/lib/auth/session.server";
import userAuthenticator, {
  getAuthenticatedUser,
} from "~/lib/auth/auth.user.server";

export default async function CMDLogoutHandler({
  request,
}: {
  request: Request;
}): Promise<ResWithInit> {
  const reqForAuth: Request = request.clone();
  const user: ShareableUser = await getAuthenticatedUser({
    request: reqForAuth,
  });
  if (user.role === UserRole.STEM) {
    return [
      {
        success: true,
        data: {
          content: `You are already logged out.`,
        },
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
}
