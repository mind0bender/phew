import type { User, UserRole } from "@prisma/client";

export class ShareableUser {
  public user_id: string;
  public name: string;
  public email: string;
  public createdAt: Date;
  public role: UserRole;
  constructor(
    user: Pick<User, "user_id" | "name" | "email" | "role" | "createdAt">
  ) {
    this.user_id = user.user_id;
    this.name = user.name;
    this.email = user.email;
    this.createdAt = user.createdAt;
    this.role = user.role;
  }
}
