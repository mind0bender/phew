import type { CMDResponse, ParseCMDReturnType } from "~/routes/command/route";

export function lineOfLength(line: number, char: string = "-"): string {
  return Array(line + 1).join(char);
}

export const loginRequiredMsg: string = `Unauthorized user identification.
Feature access restricted.
login required!`;

export function ERR500(data?: Partial<ParseCMDReturnType>): CMDResponse {
  return {
    success: false,
    data,
    errors: [
      {
        code: 500,
        message: "Internal Server Error",
      },
    ],
  };
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
