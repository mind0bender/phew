import type { Arguments } from "yargs-parser";
import type { SafeParseReturnType } from "zod";
import type { ActionArgs } from "@remix-run/node";
import type { ActionReturnType } from "~/utils/actionhelper";

import { z } from "zod";
import { json } from "@remix-run/node";
import parser from "~/lib/commands/index.server";
import CMDClearHandler from "./clear.server";
import CMDNotFoundHandler from "./notfound.server";
import CMDHelpHandler from "./help.server";
import CMDWhoAmIHandler from "./whoami.server";

export type CMDResponse = ActionReturnType<ParseCMDReturnType>;

export async function action({ request }: ActionArgs) {
  const data: any = await request.json();
  const parsedData: SafeParseReturnType<CommandActionData, CommandActionData> =
    commandActionDataSchema.safeParse(data);
  if (parsedData.success) {
    const { cmd } = parsedData.data;
    const args: Arguments = parser(cmd);

    if (!args._.length) {
      return json<CMDResponse>({
        success: true,
        data: {
          content: "",
        },
      });
    }

    switch (args._[0]) {
      case "clear":
        return json<CMDResponse>(CMDClearHandler());
      case "help":
        return json<CMDResponse>(CMDHelpHandler());
      case "whoami":
        return json<CMDResponse>(await CMDWhoAmIHandler(request));
      default:
        return json<CMDResponse>(CMDNotFoundHandler(args));
    }
  } else {
    return json<ActionReturnType>({
      success: false,
      errors: [
        {
          code: 400,
          message: "Invalid inpput",
        },
      ],
    });
  }
}

const commandActionDataSchema = z.object({
  cmd: z.string(),
});

export type CommandActionData = z.infer<typeof commandActionDataSchema>;
export interface ParseCMDReturnType {
  clear?: boolean;
  content?: string;
  data?: any;
  promise?: Promise<string>;
}
