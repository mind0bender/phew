import type { ParseCMDReturnType } from "~/routes/command/route";

export interface ActionError {
  message: string;
  code: number;
}

export type ActionReturnType<
  Data = ParseCMDReturnType,
  ErrorType = ActionError
> =
  | {
      success: false;
      errors: ErrorType[];
      data?: Data;
    }
  | {
      success: true;
      data: Data;
    };
