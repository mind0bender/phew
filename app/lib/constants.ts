import { UserRole } from "@prisma/client";
import { ShareableUser } from "~/lib/auth/shareable.user";

const DEFAULT_USER_NAME = "stem";

export const DEFAULT_USER: ShareableUser = new ShareableUser({
  name: DEFAULT_USER_NAME,
  role: UserRole.STEM,
  email: "em@il.phew",
  user_id: DEFAULT_USER_NAME,
  createdAt: new Date(),
  isVerified: false,
});
