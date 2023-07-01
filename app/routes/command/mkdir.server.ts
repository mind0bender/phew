import type { ResWithInit } from "./route";
import type { Folder } from "@prisma/client";
import type { Arguments } from "yargs-parser";
import type { SafeParseReturnType } from "zod";
import type { ShareableUser } from "~/lib/auth/shareable.user";

import path from "path";
import { z } from "zod";
import { db } from "~/utils/db.server";
import { UserRole } from "@prisma/client";
import { loginRequiredMsg } from "~/lib/misc";
import parser from "~/lib/commands/index.server";
import { getAuthenticatedUser } from "~/lib/auth/auth.user.server";

export default async function CMDMkdirHandler({
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

  const mkdirData: mkdirCMDData = mkdirDataParser({ cmd });
  const parsedMkdirData: SafeParseReturnType<mkdirCMDData, mkdirCMDData> =
    mkdirSchema.safeParse(mkdirData);
  if (!parsedMkdirData.success) {
    return [
      {
        success: false,
        errors: [
          {
            message: parsedMkdirData.error.errors[0].message,
            code: 400,
          },
        ],
      },
      {
        status: 400,
      },
    ];
  }

  const dirsToMake: string[] = Array.from(
    new Set(
      parsedMkdirData.data.directories.map((target: string): string => {
        return path.resolve("/", pwd, target);
      })
    )
  );

  const parentWorkingDirectories: {
    parent:
      | (Folder & {
          Folders: Folder[];
        })
      | null;
    name: string;
  }[] = await Promise.all(
    dirsToMake.map(
      async (
        target: string
      ): Promise<{
        parent:
          | (Folder & {
              Folders: Folder[];
            })
          | null;
        name: string;
      }> => {
        let parentName: string = path.resolve(target, "../");
        const parentWorkingDirectory:
          | (Folder & {
              Folders: Folder[];
            })
          | null = await db.folder.findFirst({
          where: {
            user_id: user.user_id,
            name: parentName,
          },
          include: {
            Folders: true,
          },
        });
        console.log({ parentName });
        return { parent: parentWorkingDirectory, name: target };
      }
    )
  );

  const contentsForEachDir: string[] = await Promise.all(
    parentWorkingDirectories.map(
      async (
        {
          parent,
          name,
        }: {
          parent:
            | (Folder & {
                Folders: Folder[];
              })
            | null;
          name: string;
        },
        i: number
      ): Promise<string> => {
        if (!parent) {
          return `[404] cannot create directory '${name}': No such file or directory`;
        }
        const subDirectoriesName: string[] = parent.Folders.map(
          (folder: Folder): string => folder.name
        );

        if (name === "/" || subDirectoriesName.includes(name)) {
          return `[409] cannot create directory '${name}': File exists`;
        }

        const targetDir: Pick<Folder, "name"> = await db.folder.create({
          data: {
            name: name,
            parent_folder_id: parent.folder_id,
            user_id: user.user_id,
          },
          select: {
            name: true,
          },
        });

        return `directory '${targetDir.name}': creation successful`;
      }
    )
  );

  const content: string = contentsForEachDir.join("\n");
  return [
    {
      success: true,
      data: {
        content,
      },
    },
  ];
}

interface MkdirDataParserArgs {
  cmd: string;
}

const mkdirDataParser: ({ cmd }: MkdirDataParserArgs) => mkdirCMDData = ({
  cmd,
}: MkdirDataParserArgs): mkdirCMDData => {
  const mkdirArgs: Arguments = parser(cmd, {
    array: ["directories"],
    alias: {
      directories: ["d", "path"],
    },
    default: {
      directories: [],
    },
  });
  const directories: string[] = [
    ...mkdirArgs.directories,
    ...mkdirArgs._?.slice(1),
  ];
  const mkdirData: mkdirCMDData = {
    directories: directories,
  };

  return mkdirData;
};

const mkdirSchema = z.object({
  directories: z
    .array(
      z
        .string()
        .min(1, "directory must be at least 1 characters")
        .max(16, "directory must be at most 16 characters")
    )
    .min(1, "missing operand"),
});

type mkdirCMDData = z.infer<typeof mkdirSchema>;