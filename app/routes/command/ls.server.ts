import type { ResWithInit } from "./route";
import type { Folder } from "@prisma/client";
import type { Arguments } from "yargs-parser";
import type { SafeParseReturnType } from "zod";
import type { ShareableUser } from "~/lib/auth/shareable.user";

import { z } from "zod";
import { db } from "~/utils/db.server";
import { join, isAbsolute } from "path";
import { UserRole } from "@prisma/client";
import parser from "~/lib/commands/index.server";
import { lineOfLength, loginRequiredMsg } from "~/lib/misc";
import { getAuthenticatedUser } from "~/lib/auth/auth.user.server";

export default async function CMDLsHandler({
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

  const lsData: LsCMDData = lsDataParser({ cmd });
  const parsedLsData: SafeParseReturnType<LsCMDData, LsCMDData> =
    lsSchema.safeParse(lsData);
  if (!parsedLsData.success) {
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

  const targets: string[] = Array.from(
    new Set(
      parsedLsData.data.files.map((target: string): string => {
        target = join(target);
        target = isAbsolute(target)
          ? target
          : [".", "./"].includes(target)
          ? pwd
          : join(pwd, target);
        return target;
      })
    )
  );

  const targetWorkingDirectories: {
    dir:
      | (Folder & {
          Folders: Folder[];
        })
      | null;
    name: string;
  }[] = await Promise.all(
    targets.map(
      async (
        target: string
      ): Promise<{
        dir:
          | (Folder & {
              Folders: Folder[];
            })
          | null;
        name: string;
      }> => {
        const targetWorkingDirectory:
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
        return { dir: targetWorkingDirectory, name: target };
      }
    )
  );

  const contentForEachDirs: string[] = targetWorkingDirectories.map(
    (targetWorkingDirectory: {
      dir:
        | (Folder & {
            Folders: Folder[];
          })
        | null;
      name: string;
    }): string => {
      if (!targetWorkingDirectory.dir) {
        return `[404] cannot access '${targetWorkingDirectory.name}': No such file or directory`;
      }
      const subDirectories: Folder[] = targetWorkingDirectory.dir.Folders;

      return `  ${targetWorkingDirectory.name}:
${lineOfLength(targetWorkingDirectory.name.length + 5)}
${subDirectories
  .map(
    (subDirectories: Folder): string =>
      `${subDirectories.name}  ${subDirectories.updatedAt.toDateString()}`
  )
  .join("\n")}`;
    }
  );

  const content: string = contentForEachDirs.join("\n");
  return [
    {
      success: true,
      data: {
        content,
      },
    },
  ];
}

interface LsDataParserArgs {
  cmd: string;
}

const lsDataParser: ({ cmd }: LsDataParserArgs) => LsCMDData = ({
  cmd,
}: LsDataParserArgs): LsCMDData => {
  const lsArgs: Arguments = parser(cmd, {
    array: ["files"],
    alias: {
      files: ["f", "path"],
    },
    default: {
      files: [],
    },
  });
  const files: string[] = [...lsArgs.files, ...lsArgs._?.slice(1)];
  const lsData: LsCMDData = {
    files: files.length ? files : ["./"],
  };

  return lsData;
};

const lsSchema = z.object({
  files: z.array(z.string().min(1)).min(1),
});

type LsCMDData = z.infer<typeof lsSchema>;
