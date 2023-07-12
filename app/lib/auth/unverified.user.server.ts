import { UserRole } from "@prisma/client";
import type { ShareableUser } from "./shareable.user";
import { loginRequiredMsg, unverifiedMsg } from "../misc";
import type { ResWithInit } from "~/routes/command/route";

export type CheckUserRoleAndVerificationReturnType =
  | {
      res: ResWithInit;
      denied: true;
    }
  | {
      denied: false;
    };

export function checkUserRoleAndVerification(
  user: ShareableUser,
  needsToBeVerified = true
): CheckUserRoleAndVerificationReturnType {
  if (user.role === UserRole.STEM) {
    return {
      denied: true,
      res: [
        {
          success: false,
          errors: [{ message: loginRequiredMsg, code: 401 }],
        },
        {
          status: 401,
        },
      ],
    };
  }
  if (needsToBeVerified && !user.isVerified) {
    return {
      denied: true,
      res: [
        {
          success: false,
          errors: [{ message: unverifiedMsg, code: 403 }],
        },
        {
          status: 403,
        },
      ],
    };
  }
  return {
    denied: false,
  };
}
