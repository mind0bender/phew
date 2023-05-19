import type { CMDResponse } from "./route";

export default function CMDClearHandler(): CMDResponse {
  return {
    success: true,
    data: {
      clear: true,
    },
  };
}
