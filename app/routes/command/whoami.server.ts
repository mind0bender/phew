import type { ResWithInit } from "./route";
import type { ShareableUser } from "~/lib/auth/shareable.user";

import { ERR500, lineOfLength } from "~/lib/misc";
import { getAuthenticatedUser } from "~/lib/auth/auth.user.server";

export default async function CMDWhoAmIHandler(
  request: Request
): Promise<ResWithInit> {
  try {
    const user: ShareableUser = await getAuthenticatedUser({ request });
    return [
      {
        success: true,
        data: {
          content: `${user.name}
${lineOfLength(user.name.length)}
user_id: ${user.user_id}
email: ${user.email}
role: ${user.role}`,
        },
      },
    ];
  } catch (error) {
    console.error(error);
    return ERR500();
  }
}
