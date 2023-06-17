import type { User, UserRole } from "@prisma/client";

export type ShareableUserSelectedType = Pick<
  User,
  "user_id" | "name" | "email" | "role" | "createdAt"
>;

export const ShareableUserSelect: {
  [key in keyof ShareableUserSelectedType]: boolean;
} = {
  user_id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
};

export class ShareableUser {
  public user_id: string;
  public name: string;
  public email: string;
  public createdAt: string;
  public role: UserRole;
  constructor(user: ShareableUserSelectedType) {
    this.user_id = user.user_id;
    this.name = user.name;
    this.email = user.email;
    this.createdAt = user.createdAt.toString();
    this.role = user.role;
  }
}
