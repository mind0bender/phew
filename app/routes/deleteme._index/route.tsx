import type { LoaderArgs } from "@remix-run/node";
import type { ShareableUser } from "~/lib/auth/shareable.user";
import type { CheckUserRoleAndVerificationReturnType } from "~/lib/auth/unverified.user.server";

import { redirect } from "@remix-run/node";
import { signJWT } from "~/lib/auth/jwt.server";
import { getAuthenticatedUser } from "~/lib/auth/auth.user.server";
import { checkUserRoleAndVerification } from "~/lib/auth/unverified.user.server";

export async function loader({ request }: LoaderArgs) {
  const user: ShareableUser = await getAuthenticatedUser({ request });
  const userAccess: CheckUserRoleAndVerificationReturnType =
    checkUserRoleAndVerification(user, false);
  if (userAccess.denied) {
    return redirect(`/`);
  }
  const token: string = signJWT(user.user_id);
  return redirect(`/deleteme/${token}`);
}
