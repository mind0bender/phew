import type { ResWithInit } from "./route";
import type { ShareableUser } from "~/lib/auth/shareable.user";

import type { Folder } from "@prisma/client";
import { UserRole } from "@prisma/client";
import { getAuthenticatedUser } from "~/lib/auth/auth.user.server";
import { loginRequiredMsg } from "~/lib/misc";
import { db } from "~/utils/db.server";
import { join } from "path";

export default async function CMDLsHandler({
  request,
  pwd,
}: {
  request: Request;
  pwd: string;
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

  const presentWorkingDirectory = await db.folder.findFirst({
    where: {
      user_id: user.user_id,
      name: pwd,
    },
    include: {
      Folders: true,
    },
  });

  if (!presentWorkingDirectory) {
    return [
      {
        success: false,
        errors: [{ message: `incorrect pwd`, code: 404 }],
      },
      {
        status: 404,
      },
    ];
  }

  console.log(presentWorkingDirectory);

  const subDirectories: Folder[] = presentWorkingDirectory.Folders;

  return [
    {
      success: true,
      data: {
        content: `present working directory: ${pwd}
----------------------------------
${subDirectories.map(
  (subDirectories: Folder): string =>
    `${join(
      pwd,
      subDirectories.name
    )}  ${subDirectories.updatedAt.toDateString()}`
)}`,
      },
    },
  ];
}
