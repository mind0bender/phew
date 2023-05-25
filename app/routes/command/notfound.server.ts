import type { ResWithInit } from "./route";
import type { Arguments } from "yargs-parser";

export default function CMDNotFoundHandler(args: Arguments): ResWithInit {
  return [
    {
      success: true,
      data: {
        content: `${args._[0]}: command not found
Try: help`,
      },
    },
  ];
}
