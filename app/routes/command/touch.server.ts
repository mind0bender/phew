import type { Arguments } from "yargs-parser";
import type { SafeParseReturnType } from "zod";
import type { Folder, Phew } from "@prisma/client";
import type { ResWithInit } from "~/routes/command/route";
import type { HashedPassword } from "~/utils/pswd.server";
import type { ShareableUser } from "~/lib/auth/shareable.user";
import type { CheckUserRoleAndVerificationReturnType } from "~/lib/auth/unverified.user.server";

import path from "path";
import { z } from "zod";
import { db } from "~/utils/db.server";
import Password from "~/utils/pswd.server";
import parser from "~/lib/commands/index.server";
import { ERR500 } from "~/lib/misc";
import { getAuthenticatedUser } from "~/lib/auth/auth.user.server";
import updateParentFoldersRecursive from "~/lib/modify/folder.update.server";
import { checkUserRoleAndVerification } from "~/lib/auth/unverified.user.server";

export default async function CMDTouchHandler({
  request,
  pwd,
  cmd,
}: {
  request: Request;
  pwd: string;
  cmd: string;
}): Promise<ResWithInit> {
  const reqForAuth: Request = request.clone();
  try {
    const user: ShareableUser = await getAuthenticatedUser({
      request: reqForAuth,
    });
    const userAccess: CheckUserRoleAndVerificationReturnType =
      checkUserRoleAndVerification(user);
    if (userAccess.denied) {
      return userAccess.res;
    }

    const touchData: TouchCMDData = touchDataParser({ cmd });
    const parsedTouchData: SafeParseReturnType<TouchCMDData, TouchCMDData> =
      touchSchema.safeParse(touchData);
    if (!parsedTouchData.success) {
      return [
        {
          success: false,
          errors: [
            {
              message: parsedTouchData.error.errors[0].message,
              code: 400,
            },
          ],
        },
      ];
    }

    const target: string = path.resolve(
      "/",
      pwd,
      parsedTouchData.data.filename
    );
    const parentDirName: string = path.resolve(target, "../");
    const parentDir: {
      folder_id: string | undefined;
      name: string;
    } = {
      folder_id: (
        await db.folder.findFirst({
          where: {
            user_id: user.user_id,
            name: parentDirName,
          },
          select: {
            folder_id: true,
          },
        })
      )?.folder_id,
      name: parentDirName,
    };

    if (!parentDir.folder_id) {
      return [
        {
          success: false,
          errors: [
            {
              code: 404,
              message: `[404] cannot access '${parentDir.name}': No such file or directory`,
            },
          ],
        },
      ];
    }

    const alreadyExistsPhew: Pick<Phew, "phew_id"> | null =
      await db.phew.findFirst({
        where: {
          parent_folder_id: parentDir.folder_id,
          name: target,
        },
        select: {
          phew_id: true,
        },
      });

    const alreadyExistsFolderWithDotPhew: Pick<Folder, "folder_id"> | null =
      await db.folder.findFirst({
        where: {
          parent_folder_id: parentDir.folder_id,
          name: target,
        },
        select: {
          folder_id: true,
        },
      });

    if (alreadyExistsFolderWithDotPhew) {
      // if there exists a folder with the same name
      // eg. `myfolder.phew` is a perfectly valid folder name
      // then update the updatedAt property
      await updateParentFoldersRecursive(alreadyExistsFolderWithDotPhew);
      return [
        {
          success: true,
          data: {
            content: ``,
          },
        },
        {
          status: 200,
        },
      ];
    }

    if (alreadyExistsPhew) {
      // update the `updatedAt` property of the phew
      const {
        parent_folder_id: parentDirId,
      }: Pick<Folder, "parent_folder_id"> = await db.phew.update({
        where: {
          phew_id: alreadyExistsPhew.phew_id,
        },
        data: {},
        select: {
          parent_folder_id: true,
        },
      });
      await updateParentFoldersRecursive({ folder_id: parentDirId });
      return [
        {
          success: true,
          data: {
            content: "",
          },
        },
        {
          status: 200,
        },
      ];
    } else {
      const parentDirId: string | undefined = parentDir.folder_id;

      const password: Password = new Password(parsedTouchData.data.password);
      const hashedPassword: HashedPassword = await password.hash();

      // const newPhew: Pick<Phew, "phew_id"> =
      await db.phew.create({
        data: {
          name: target,
          parent_folder_id: parentDirId,
          user_id: user.user_id,
          password: hashedPassword.hash,
          salt: hashedPassword.salt,
        },
        select: {
          phew_id: true,
        },
      });

      await updateParentFoldersRecursive({ folder_id: parentDirId });
      return [
        {
          success: true,
          data: {
            content: `phew '${target}': creation successful`,
          },
        },
        {
          status: 200,
        },
      ];
    }
  } catch (error) {
    console.error(error);
    return ERR500();
  }
}

interface TouchDataParserArgs {
  cmd: string;
}

const touchDataParser: ({ cmd }: TouchDataParserArgs) => TouchCMDData = ({
  cmd,
}: TouchDataParserArgs): TouchCMDData => {
  const touchArgs: Arguments = parser(cmd, {
    string: ["pswd"],
    alias: {
      pswd: ["p", "password"],
    },
    default: {
      pswd: "",
    },
  });
  const file = String(touchArgs._[1]);
  const touchData: TouchCMDData = {
    filename: file,
    password: touchArgs.password,
  };

  return touchData;
};

const touchSchema = z.object({
  filename: z.string().min(1, "filename must be atleast 1 characters"),
  password: z
    .string({
      required_error: "password is required",
    })
    .max(30, "password must be at most 30 characters"),
});

type TouchCMDData = z.infer<typeof touchSchema>;
