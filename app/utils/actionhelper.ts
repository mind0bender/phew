export interface ActionError {
  message: string;
  code: number;
}

export type ActionReturnType<Data = any, ErrorType = ActionError> =
  | {
      success: false;
      errors: ErrorType[];
    }
  | {
      success: true;
      data: Data;
    };
