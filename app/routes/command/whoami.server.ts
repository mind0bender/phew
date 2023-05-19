import { getAuthenticatedUser } from "~/lib/auth/auth.user.server";
import type { CMDResponse } from "./route";
import type { ShareableUser } from "~/lib/auth/shareable.user";
import { lineOfLength } from "~/lib/misc";

export default async function CMDWhoAmIHandler(
  request: Request
): Promise<CMDResponse> {
  const user: ShareableUser = await getAuthenticatedUser({ request });
  return {
    success: true,
    data: {
      content: `${user.name}
${lineOfLength(user.name.length)}
user_id: ${user.user_id}
email: ${user.email}
role: ${user.role}`,
    },
  };
}
