import type { Arguments } from "yargs-parser";
import type { SafeParseReturnType } from "zod";
import type { ActionArgs } from "@remix-run/node";
import type { ActionReturnType } from "~/utils/actionhelper";

import { z } from "zod";
import { ERR500 } from "~/lib/misc";
import { json } from "@remix-run/node";
import CMDTouchHandler from "./touch.server";
import parser from "~/lib/commands/index.server";
import CMDLsHandler from "~/routes/command/ls.server";
import CMDCdHandler from "~/routes/command/cd.server";
import CMDHelpHandler from "~/routes/command/help.server";
import CMDMkdirHandler from "~/routes/command/mkdir.server";
import CMDClearHandler from "~/routes/command/clear.server";
import CMDLoginHandler from "~/routes/command/login.server";
import CMDWhoAmIHandler from "~/routes/command/whoami.server";
import CMDSignupHandler from "~/routes/command/signup.server";
import CMDLogoutHandler from "~/routes/command/logout.server";
import CMDNotFoundHandler from "~/routes/command/notfound.server";

export type CMDResponse = ActionReturnType<ParseCMDReturnType>;
export type ResWithInit = [CMDResponse, ResponseInit?];

export async function action({ request }: ActionArgs) {
  try {
    const reqForAuth: Request = request.clone();
    const data: any = await request.json();
    const parsedData: SafeParseReturnType<
      CommandActionData,
      CommandActionData
    > = commandActionDataSchema.safeParse(data);
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
        case "touch":
          return json<CMDResponse>(
            ...(await CMDTouchHandler({ request: reqForAuth, pwd: pwd, cmd }))
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
  } catch (error) {
    console.error(error);
    return ERR500();
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

export interface EditorData {
  filename: string;
  content: string;
}

export interface ParseCMDReturnType {
  clear?: boolean;
  content: string;
  data?: any;
  fetchForm?: string | true;
  updateUser?: boolean;
  pwd?: string;
  editor?: EditorData;
}
