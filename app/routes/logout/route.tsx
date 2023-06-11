import type { LoaderArgs } from "@remix-run/node";
import CMDLogoutHandler from "../command/logout.server";

export async function loader({ request }: LoaderArgs) {
  await CMDLogoutHandler({ request });
  return null;
}
