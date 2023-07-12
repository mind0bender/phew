import type { Folder } from "@prisma/client";

import { db } from "~/utils/db.server";

export default async function deleteFoldersWithChildsRecursive({
  folder_id,
}: Pick<Folder, "folder_id">): Promise<void> {
  const foldersStructureToDelete: string[][] = [[folder_id]];
  let lastLevelFolders: string[] = [folder_id];
  try {
    while (lastLevelFolders.length) {
      // We need to first find the current level folders since prisma doesn't have a findAndDelete method
      // and we need their folder_ids to find the next level
      lastLevelFolders = (
        await db.folder.findMany({
          where: {
            OR: lastLevelFolders.map(
              (lastDeletedFolder: string): Pick<Folder, "parent_folder_id"> => {
                return {
                  parent_folder_id: lastDeletedFolder,
                };
              }
            ),
          },
          select: {
            folder_id: true,
            name: true,
          },
        })
      ).map((foldersToDelete: Pick<Folder, "folder_id" | "name">): string => {
        return foldersToDelete.folder_id;
      });
      lastLevelFolders.length &&
        foldersStructureToDelete.push(lastLevelFolders);
    }
    while (foldersStructureToDelete.length) {
      const foldersToDelete: string[] = foldersStructureToDelete.splice(
        foldersStructureToDelete.length - 1
      )[0]; // delete from the lowest leaf, so there are no node without a parent except for the (folder_id)
      await db.folder.deleteMany({
        where: {
          OR: foldersToDelete.map(
            (folderToDelete: string): Pick<Folder, "folder_id"> => ({
              folder_id: folderToDelete,
            })
          ),
        },
      });
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}
