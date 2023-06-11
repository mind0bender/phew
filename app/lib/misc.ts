import type { CMDResponse, ParseCMDReturnType } from "~/routes/command/route";

export function lineOfLength(line: number, symbol: string = "-"): string {
  return Array(line + 1).join(symbol);
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
