import type { Arguments } from "yargs-parser";
import type { SafeParseReturnType } from "zod";
import type { Folder, Phew } from "@prisma/client";
import type { ResWithInit } from "~/routes/command/route";
import type { ShareableUser } from "~/lib/auth/shareable.user";
import type { CheckUserRoleAndVerificationReturnType } from "~/lib/auth/unverified.user.server";

import {
  ERR500,
  fixedDigits,
  getFolderPermissions,
  lineOfLength,
} from "~/lib/misc";
import path from "path";
import { z } from "zod";
import { db } from "~/utils/db.server";
import parser from "~/lib/commands/index.server";
import { getAuthenticatedUser } from "~/lib/auth/auth.user.server";
import { checkUserRoleAndVerification } from "~/lib/auth/unverified.user.server";

type CommonInFolderAndPhew = "updatedAt" | "name" | "readonly" | "private";
type PhewOrFolder = Pick<Phew | Folder, CommonInFolderAndPhew> & {
  isDir: boolean;
};

export default async function CMDLsHandler({
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
          return path.resolve("/", pwd, target);
        })
      )
    );

    const targetWorkingDirectories: {
      dir:
        | (Folder & {
            Folders: Pick<Folder, CommonInFolderAndPhew>[];
            phews: Pick<Phew, CommonInFolderAndPhew>[];
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
                Folders: Pick<Folder, CommonInFolderAndPhew>[];
                phews: Pick<Phew, CommonInFolderAndPhew>[];
              })
            | null;
          name: string;
        }> => {
          const targetWorkingDirectory:
            | (Folder & {
                Folders: Pick<Folder, CommonInFolderAndPhew>[];
                phews: Pick<Phew, CommonInFolderAndPhew>[];
              })
            | null = await db.folder.findFirst({
            where: {
              user_id: user.user_id,
              name: target,
            },
            include: {
              Folders: {
                select: {
                  name: true,
                  updatedAt: true,
                  readonly: true,
                  private: true,
                },
              },
              phews: {
                select: {
                  name: true,
                  updatedAt: true,
                  readonly: true,
                  private: true,
                },
              },
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
              Folders: Pick<Folder, CommonInFolderAndPhew>[];
              phews: Pick<Phew, CommonInFolderAndPhew>[];
            })
          | null;
        name: string;
      }): string => {
        if (!targetWorkingDirectory.dir) {
          return `[404] cannot access '${targetWorkingDirectory.name}': No such file or directory`;
        }
        const subDirectories: PhewOrFolder[] =
          targetWorkingDirectory.dir.Folders.map(
            (folder: Pick<Folder, CommonInFolderAndPhew>): PhewOrFolder => ({
              ...folder,
              isDir: true,
            })
          );
        const subPhews: PhewOrFolder[] = targetWorkingDirectory.dir.phews.map(
          (phew: Pick<Phew, CommonInFolderAndPhew>): PhewOrFolder => ({
            ...phew,
            isDir: false,
          })
        );

        const subDirsAndsubPhews: PhewOrFolder[] = [
          ...subDirectories,
          ...subPhews,
        ].sort(
          (prevSubDir: PhewOrFolder, currSubDir: PhewOrFolder): number =>
            // latest first
            currSubDir.updatedAt.getTime() - prevSubDir.updatedAt.getTime()
        );

        const longestSubDirName: string = subDirsAndsubPhews.reduce(
          (
            prevLongestSubDirName: string,
            currSubDir: Pick<Folder | Phew, "updatedAt" | "name">
          ): string => {
            if (currSubDir.name.length > prevLongestSubDirName.length) {
              return currSubDir.name;
            } else {
              return prevLongestSubDirName;
            }
          },
          ""
        );

        return `      ${targetWorkingDirectory.name}:      total: ${fixedDigits(
          subDirsAndsubPhews.length,
          2
        )}
    ${lineOfLength(targetWorkingDirectory.name.length + 5, "_")}
${subDirsAndsubPhews
  .map((subContent: PhewOrFolder): string => {
    const baseName: string = path.basename(subContent.name);
    const permissions: string = getFolderPermissions({
      readonly: subContent.readonly,
      isPrivate: subContent.private,
    });
    return ` ${subContent.isDir ? `□` : `▪`}  ${baseName} ${lineOfLength(
      longestSubDirName.length - subContent.name.length + 2,
      " "
    )} ${permissions}    ${subContent.updatedAt.toLocaleDateString()}`;
  })
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
  } catch (error) {
    console.error(error);
    return ERR500();
  }
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
