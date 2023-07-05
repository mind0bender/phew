import type { ParseCMDReturnType, ResWithInit } from "~/routes/command/route";

export function lineOfLength(line: number, char: string = "-"): string {
  return Array(line + 1).join(char);
}

export const loginRequiredMsg: string = `Unauthorized user identification.
Feature access denied.
login required!`;

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

export function fixedDigits(val: number, numberOfDigits: number = 0): string {
  const digitsInVal: number = val.toString().length;
  if (digitsInVal >= numberOfDigits) {
    return val.toString();
  }
  return Array(numberOfDigits - digitsInVal)
    .fill(0)
    .concat(val.toString().split(""))
    .join("");
}
