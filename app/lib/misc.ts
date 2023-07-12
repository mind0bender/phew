import type { ParseCMDReturnType, ResWithInit } from "~/routes/command/route";

export function lineOfLength(line: number, char = "-"): string {
  return Array(line + 1).join(char);
}

export const loginRequiredMsg = `Unauthorized user identification.
Feature access denied.
login required!`;

export const unverifiedMsg = `Unverified user identification.
Feature access forbidden.
email verification required!`;

export function ERR500(data?: ParseCMDReturnType): ResWithInit {
  return [
    {
      success: false,
      data,
      errors: [
        {
          code: 500,
          message: "Internal Server Error",
        },
      ],
    },
    {
      status: 500,
    },
  ];
}

export interface PermissionsArgs {
  readonly: boolean;
  isPrivate: boolean;
}

export function getFolderPermissions({
  readonly,
  isPrivate, // cannot use variable `private` because of strict mode X0;
}: PermissionsArgs): string {
  return `r${readonly ? "-" : "w"}-${isPrivate ? "-" : "r"}-`;
}

export function fixedDigits(val: number, numberOfDigits = 0): string {
  const digitsInVal: number = val.toString().length;
  if (digitsInVal >= numberOfDigits) {
    return val.toString();
  }
  return Array(numberOfDigits - digitsInVal)
    .fill(0)
    .concat(val.toString().split(""))
    .join("");
}
