import type { Session } from "@remix-run/node";
import type { ResWithInit } from "~/routes/command/route";
import type { ShareableUser } from "~/lib/auth/shareable.user";
import type { CheckUserRoleAndVerificationReturnType } from "~/lib/auth/unverified.user.server";

import { ERR500 } from "~/lib/misc";
import userAuthenticator, {
  getAuthenticatedUser,
} from "~/lib/auth/auth.user.server";
import { commitSession, getSession } from "~/lib/auth/session.server";
import { checkUserRoleAndVerification } from "~/lib/auth/unverified.user.server";

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
    const userAccess: CheckUserRoleAndVerificationReturnType =
      checkUserRoleAndVerification(user, false);
    if (userAccess.denied) {
      return userAccess.res;
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
