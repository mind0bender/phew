import type { Arguments } from "yargs-parser";
import type { CMDResponse } from "./route";

export default function CMDNotFoundHandler(args: Arguments): CMDResponse {
  return {
    success: true,
    data: {
      content: `${args._[0]}: command not found
Try: help`,
    },
  };
}
