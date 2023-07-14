import type { Params } from "react-router";
import type { Folder, User } from "@prisma/client";
import type { JwtPayload } from "~/lib/auth/jwt.server";
import type { ChangeEvent, ChangeEventHandler } from "react";
import type { ShareableUserSelectedType } from "~/lib/auth/shareable.user";
import type { ActionArgs, LoaderArgs, TypedResponse } from "@remix-run/node";

import { z } from "zod";
import {
  verifyJWT,
  TokenExpiredError,
  JsonWebTokenError,
} from "~/lib/auth/jwt.server";
import { json } from "react-router";
import { db } from "~/utils/db.server";
import { redirect } from "@remix-run/node";
import { useCallback, useState } from "react";
import { Form, useLoaderData } from "@remix-run/react";
import { ShareableUserSelect, ShareableUser } from "~/lib/auth/shareable.user";
import deleteFoldersWithChildsRecursive from "~/lib/modify/folder.delete.server";

interface UserNotFound {
  userFound: false;
  error: string;
}

interface UserFound {
  userFound: true;
  user: ShareableUser;
}

const validDeletes: string[] = ["delete"];

export async function loader({
  params,
}: LoaderArgs): Promise<TypedResponse<UserFound | UserNotFound>> {
  const { token }: Params<"token"> = params;
  if (!token) {
    return json<UserNotFound>({
      userFound: false,
      error: `Invalid token`,
    });
  }

  try {
    const user_id: string = verifyJWT(token);
    if (typeof user_id !== "string") {
      return json<UserNotFound>({
        userFound: false,
        error: `Invalid token`,
      });
    }

    const user: ShareableUserSelectedType | null = await db.user.findUnique({
      where: {
        user_id,
      },
      select: ShareableUserSelect,
    });
    if (user) {
      return json<UserFound>({
        userFound: true,
        user: new ShareableUser(user),
      });
    } else {
      return json<UserNotFound>({
        userFound: false,
        error: `user does not exist`,
      });
    }
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return json<UserNotFound>({
        userFound: false,
        error: `token expired`,
      });
    }
    if (error instanceof JsonWebTokenError) {
      return json<UserNotFound>({
        userFound: false,
        error: `Invalid token`,
      });
    }
    console.error(error);
    return json<UserNotFound>({
      userFound: false,
      error: `Internal server error`,
    });
  }
}

export default function DeletemeWithTokenPage(): JSX.Element {
  const data = useLoaderData<typeof loader>();

  const [shouldDelete, setShouldDelete] = useState<string>("");
  const changeHandler: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      setShouldDelete(e.target.value);
    },
    []
  );

  return (
    <label htmlFor={"shouldDelete"} className={`p-2 grow`}>
      {data.userFound ? (
        <>
          <div>User identified: {data.user.name}</div>
          <div>role: {data.user.role}</div>
          <br />
          <div>
            Are you sure you want to delete your account? You will permanently
            lose your:
            <ul className={`list-[square] ml-6`}>
              <li>profile</li>
              <li>folders</li>
              <li>phews</li>
            </ul>
            <br />
            To delete your account, type{" "}
            <code className={`border-b-2 border-error-500 px-1 py-0.5`}>
              delete
            </code>
            .
            <br />
            <br />
            <Form method="POST">
              <span>&gt; </span>
              <input
                className={`bg-transparent caret-error-500 ${
                  validDeletes.includes(shouldDelete) && "text-red-500"
                } ring-white border-none outline-none rounded-none`}
                name={"shouldDelete"}
                id={"shouldDelete"}
                autoFocus
                autoCapitalize={"none"}
                autoComplete={"off"}
                autoCorrect={"off"}
                type="text"
                value={shouldDelete}
                onChange={changeHandler}
              />
            </Form>
          </div>
        </>
      ) : (
        <div>{data.error}</div>
      )}
    </label>
  );
}

export async function action({ request, params }: ActionArgs) {
  const { token }: Params = params;

  const data: FormData = await request.formData();
  const shouldDeleteStr: FormDataEntryValue | null = data.get("shouldDelete");
  const parsedShouldDelete: z.SafeParseReturnType<string, string> = z
    .string()
    .safeParse(shouldDeleteStr);
  if (!parsedShouldDelete.success) {
    return json<UserNotFound>({
      userFound: false,
      error: `Invalid input`,
    });
  }

  const shouldDelete: boolean = validDeletes.includes(parsedShouldDelete.data);

  if (!token) {
    return json<UserNotFound>({
      userFound: false,
      error: `Invalid token`,
    });
  }
  try {
    const user_id: string | JwtPayload = verifyJWT(token);
    if (typeof user_id !== "string") {
      return json<UserNotFound>({
        userFound: false,
        error: `Invalid token`,
      });
    }
    if (shouldDelete) {
      const user: ShareableUserSelectedType | null = await db.user.findUnique({
        where: {
          user_id,
        },
        select: ShareableUserSelect,
      });
      if (!user) {
        return json<UserNotFound>({
          userFound: false,
          error: `user not found`,
        });
      } else {
        const rootDir: Folder | null = await db.folder.findFirst({
          where: {
            user_id,
            name: "/",
          },
        });
        if (!rootDir) {
          return json<UserNotFound>({
            userFound: false,
            error: `root dir(/) not found`,
          });
        }
        await deleteFoldersWithChildsRecursive({
          folder_id: rootDir.folder_id,
        });
        const user: Pick<User, "name"> | null = await db.user.delete({
          where: {
            user_id,
          },
          select: {
            name: true,
          },
        });
        if (!user) {
          return json<UserNotFound>({
            userFound: false,
            error: `user not found`,
          });
        } else {
          return redirect("/");
        }
      }
    } else {
      return redirect("/");
    }
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return json<UserNotFound>({
        userFound: false,
        error: `token expired`,
      });
    }
    if (error instanceof JsonWebTokenError) {
      return json<UserNotFound>({
        userFound: false,
        error: `Invalid token`,
      });
    }
    console.error(error);
    return json<UserNotFound>({
      userFound: false,
      error: `Internal server error`,
    });
  }
}
