import { json } from "@remix-run/node";
import type { LoaderArgs } from "@remix-run/node";
import { getAuthenticatedUser } from "~/lib/auth/auth.user.server";
import type { ShareableUser } from "~/lib/auth/shareable.user";
import { DEFAULT_USER } from "~/lib/constants";

export async function loader({ request }: LoaderArgs) {
  let user: ShareableUser =
    (await getAuthenticatedUser({ request })) || DEFAULT_USER;
  return json({ user });
}
