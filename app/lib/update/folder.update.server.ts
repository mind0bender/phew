// TODO: make the updateFolder

import type { Folder } from "@prisma/client";
import { db } from "~/utils/db.server";

export default async function updateParentFoldersRecursive({
  folder_id,
}: Pick<Folder, "folder_id"> | { folder_id: null }) {
  try {
    while (folder_id) {
      // exit on undefined as that is the case for every root(/) dir
      const { parent_folder_id }: Pick<Folder, "parent_folder_id"> =
        await db.folder.update({
          where: {
            folder_id,
          },
          data: {
            updatedAt: new Date(),
          },
          select: {
            parent_folder_id: true,
          },
        });
      folder_id = parent_folder_id;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}
