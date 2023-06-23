import type { Arguments } from "yargs-parser";
import type { SafeParseReturnType } from "zod";
import type { ActionArgs } from "@remix-run/node";
import type { ActionReturnType } from "~/utils/actionhelper";

import { z } from "zod";
import { json } from "@remix-run/node";
import CMDCdHandler from "./cd.server";
import CMDLsHandler from "./ls.server";
import CMDHelpHandler from "./help.server";
import CMDLoginHandler from "./login.server";
import CMDClearHandler from "./clear.server";
import CMDMkdirHandler from "./mkdir.server";
import CMDWhoAmIHandler from "./whoami.server";
import CMDSignupHandler from "./signup.server";
import CMDLogoutHandler from "./logout.server";
import parser from "~/lib/commands/index.server";
import CMDNotFoundHandler from "./notfound.server";

export type CMDResponse = ActionReturnType<ParseCMDReturnType>;
export type ResWithInit = [CMDResponse, ResponseInit?];

export async function action({ request }: ActionArgs) {
  const reqForAuth: Request = request.clone();
  const data: any = await request.json();
  const parsedData: SafeParseReturnType<CommandActionData, CommandActionData> =
    commandActionDataSchema.safeParse(data);
  if (parsedData.success) {
    const { cmd, pwd } = parsedData.data;
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
        return json<CMDResponse>(...CMDClearHandler());
      case "help":
        return json<CMDResponse>(...CMDHelpHandler());
      case "whoami":
        return json<CMDResponse>(...(await CMDWhoAmIHandler(request)));
      case "signup":
        return json<CMDResponse>(
          ...(await CMDSignupHandler({ request: reqForAuth, cmd }))
        );
      case "login":
        return json<CMDResponse>(
          ...(await CMDLoginHandler({ request: reqForAuth, cmd }))
        );
      case "logout":
        return json<CMDResponse>(
          ...(await CMDLogoutHandler({ request: reqForAuth }))
        );
      case "ls":
        return json<CMDResponse>(
          ...(await CMDLsHandler({ request: reqForAuth, pwd: pwd, cmd }))
        );
      case "mkdir":
        return json<CMDResponse>(
          ...(await CMDMkdirHandler({ request: reqForAuth, pwd: pwd, cmd }))
        );
      case "cd":
        return json<CMDResponse>(
          ...(await CMDCdHandler({ request: reqForAuth, pwd: pwd, cmd }))
        );
      default:
        return json<CMDResponse>(...CMDNotFoundHandler(args));
    }
  } else {
    return json<ActionReturnType>({
      success: false,
      errors: [
        {
          code: 400,
          message: "Invalid input",
        },
      ],
    });
  }
}

const commandActionDataSchema = z.object({
  cmd: z.string({
    required_error: "command is required",
  }),
  pwd: z.string({
    required_error: "pwd is required",
  }),
});

export type CommandActionData = z.infer<typeof commandActionDataSchema>;
export interface ParseCMDReturnType {
  clear?: boolean;
  content?: string;
  data?: any;
  fetchForm?: string | true;
  updateUser?: boolean;
  pwd?: string;
}
