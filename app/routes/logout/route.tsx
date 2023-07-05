import type { LoaderArgs } from "@remix-run/node";
import CMDLogoutHandler from "../command/logout.server";

export async function loader({ request }: LoaderArgs) {
  try {
    await CMDLogoutHandler({ request });
  } catch (error) {
    console.error(error);
  }
  return null;
}
