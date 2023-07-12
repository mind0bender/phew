import type { Arguments } from "yargs-parser";
import type { ResWithInit } from "~/routes/command/route";

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
