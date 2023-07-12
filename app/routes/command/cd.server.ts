import type { Folder } from "@prisma/client";
import type { Arguments } from "yargs-parser";
import type { SafeParseReturnType } from "zod";
import type { ResWithInit } from "~/routes/command/route";
import type { ShareableUser } from "~/lib/auth/shareable.user";
import type { CheckUserRoleAndVerificationReturnType } from "~/lib/auth/unverified.user.server";

import { z } from "zod";
import path from "path";
import { db } from "~/utils/db.server";
import parser from "~/lib/commands/index.server";
import { ERR500 } from "~/lib/misc";
import { getAuthenticatedUser } from "~/lib/auth/auth.user.server";
import { checkUserRoleAndVerification } from "~/lib/auth/unverified.user.server";

export default async function CMDCdHandler({
  request,
  pwd,
  cmd,
}: {
  request: Request;
  pwd: string;
  cmd: string;
}): Promise<ResWithInit> {
  try {
    const reqForAuth: Request = request.clone();
    const user: ShareableUser = await getAuthenticatedUser({
      request: reqForAuth,
    });
    const userAccess: CheckUserRoleAndVerificationReturnType =
      checkUserRoleAndVerification(user);
    if (userAccess.denied) {
      return userAccess.res;
    }

    const cdData: cdCMDData = cdDataParser({ cmd });
    const parsedCdData: SafeParseReturnType<cdCMDData, cdCMDData> =
      cdSchema.safeParse(cdData);
    if (!parsedCdData.success) {
      return [
        {
          success: false,
          errors: [
            {
              message: "Invalid Input",
              code: 400,
            },
          ],
        },
      ];
    }

    const target: string = path.resolve("/", pwd, parsedCdData.data.directory);

    const changedDirectory:
      | (Folder & {
          Folders: Folder[];
        })
      | null = await db.folder.findFirst({
      where: {
        user_id: user.user_id,
        name: target,
      },
      include: {
        Folders: true,
      },
    });

    if (!changedDirectory) {
      return [
        {
          success: false,
          errors: [
            {
              message: `cd: '${target}': No such file or directory`,
              code: 404,
            },
          ],
        },
      ];
    } else {
      return [
        {
          success: true,
          data: {
            content: "",
            pwd: changedDirectory.name,
          },
        },
      ];
    }
  } catch (error) {
    console.error(error);
    return ERR500();
  }
}

interface CdDataParserArgs {
  cmd: string;
}

const cdDataParser: ({ cmd }: CdDataParserArgs) => cdCMDData = ({
  cmd,
}: CdDataParserArgs): cdCMDData => {
  const cdArgs: Arguments = parser(cmd, {
    // array: ["directory"],
    // alias: {
    //   directories: ["d", "path"],
    // },
    // default: {
    //   directory: "/",
    // },
  });
  const directory = String(cdArgs._[1] || "/");
  const cdData: cdCMDData = {
    directory: directory,
  };

  return cdData;
};

const cdSchema = z.object({
  directory: z.string().min(1),
});

type cdCMDData = z.infer<typeof cdSchema>;
