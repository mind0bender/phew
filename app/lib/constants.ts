import { UserRole } from "@prisma/client";
import { ShareableUser } from "./auth/shareable.user";

const DEFAULT_USER_NAME: string = "stem";

export const DEFAULT_USER: ShareableUser = new ShareableUser({
  name: DEFAULT_USER_NAME,
  email: "em@il.phew",
  role: UserRole.STEM,
  user_id: DEFAULT_USER_NAME,
  createdAt: new Date(),
});
