import type { Params } from "react-router";
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

interface UserNotFound {
  userFound: false;
  error: string;
}

interface UserFound {
  userFound: true;
  user: ShareableUser;
}

const validShouldVerify: string[] = ["verify"];

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

export default function VerifymeWithTOkenPage(): JSX.Element {
  const data = useLoaderData<typeof loader>();

  const [verify, setVerify] = useState<string>("");
  const changeHandler: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      setVerify(e.target.value);
    },
    []
  );

  return (
    <label htmlFor={"verify"} className={`p-2 grow`}>
      {data.userFound ? (
        <>
          <div>User identified: {data.user.name}</div>
          <div>role: {data.user.role}</div>
          <br />
          {data.user.isVerified ? (
            <div>This account has been verified, you can start using phew.</div>
          ) : (
            <div>
              To proceed with the account verification, please confirm by
              entering{" "}
              <code
                onClick={() => {
                  setVerify(validShouldVerify[0]);
                }}
                className={`border-b-2 border-primary-400 hover:border-tertiary-300 px-1 py-0.5 duration-150`}>
                verify
              </code>
              .
              <br />
              To delete your account, enter any other key.
              <br />
              <br />
              <Form method="POST">
                <span>&gt; </span>
                <input
                  className={`bg-transparent caret-primary-400 ${
                    validShouldVerify.includes(verify)
                      ? "text-primary-400"
                      : "text-secondary-400"
                  } ring-white border-none outline-none rounded-none`}
                  name={"verify"}
                  id={"verify"}
                  autoFocus
                  autoCapitalize={"none"}
                  autoComplete={"off"}
                  autoCorrect={"off"}
                  type="text"
                  value={verify}
                  onChange={changeHandler}
                />
              </Form>
            </div>
          )}
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
  const verify: FormDataEntryValue | null = data.get("verify");
  const parsedVerify: z.SafeParseReturnType<string, string> = z
    .string()
    .safeParse(verify);
  if (!parsedVerify.success) {
    return json<UserNotFound>({
      userFound: false,
      error: `Invalid input`,
    });
  }

  const shouldVerify: boolean = validShouldVerify.includes(parsedVerify.data);

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
    if (shouldVerify) {
      const user: ShareableUserSelectedType | null = await db.user.update({
        where: {
          user_id,
        },
        data: {
          isVerified: true,
        },
        select: ShareableUserSelect,
      });
      if (!user) {
        return json<UserNotFound>({
          userFound: false,
          error: `user not found`,
        });
      } else {
        return json<UserFound>({
          userFound: true,
          user: new ShareableUser(user),
        });
      }
    } else {
      return redirect(`/deleteme/${token}`);
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
