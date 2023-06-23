import type { ResWithInit } from "./route";
import type { Folder } from "@prisma/client";
import type { Arguments } from "yargs-parser";
import type { SafeParseReturnType } from "zod";
import type { ShareableUser } from "~/lib/auth/shareable.user";

import { z } from "zod";
import { join, isAbsolute } from "path";
import { db } from "~/utils/db.server";
import { UserRole } from "@prisma/client";
import { loginRequiredMsg } from "~/lib/misc";
import parser from "~/lib/commands/index.server";
import { getAuthenticatedUser } from "~/lib/auth/auth.user.server";

export default async function CMDCdHandler({
  request,
  pwd,
  cmd,
}: {
  request: Request;
  pwd: string;
  cmd: string;
}): Promise<ResWithInit> {
  const reqForAuth: Request = request.clone();
  const user: ShareableUser = await getAuthenticatedUser({
    request: reqForAuth,
  });
  if (user.role === UserRole.STEM) {
    return [
      {
        success: false,
        errors: [{ message: loginRequiredMsg, code: 401 }],
      },
      {
        status: 401,
      },
    ];
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

  let target: string = join(parsedCdData.data.directory);
  target = isAbsolute(target)
    ? target
    : [".", "./"].includes(target)
    ? pwd
    : join(pwd, target);

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
  const directory: string = String(cdArgs._[1] || "/");
  const cdData: cdCMDData = {
    directory: directory,
  };

  return cdData;
};

const cdSchema = z.object({
  directory: z.string().min(1),
});

type cdCMDData = z.infer<typeof cdSchema>;
