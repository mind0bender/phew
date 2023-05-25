import type { CMDResponse, ParseCMDReturnType } from "~/routes/command/route";

export function lineOfLength(line: number, symbol: string = "-"): string {
  return Array(line + 1).join(symbol);
}

export function onlyForRegisteredUsers(
  data?: Partial<ParseCMDReturnType>
): ParseCMDReturnType {
  return {
    content: `This feature is only available for registered users.
Please sign up to access this command`,
    ...data,
  };
}

export function ERR500(data?: Partial<CMDResponse>): CMDResponse {
  return {
    success: false,
    errors: [
      {
        code: 500,
        message: "Internal Server Error",
      },
    ],
  };
}
