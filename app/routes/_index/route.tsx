import type { CMDResponse } from "../command/route";
import type { ReactNode, KeyboardEvent } from "react";
import type { V2_MetaDescriptor } from "@remix-run/node";
import type { ShareableUser } from "~/lib/auth/shareable.user";
import type { LoaderArgs, V2_MetaFunction } from "@remix-run/node";

import { useEffect } from "react";
import { json } from "@remix-run/node";
import Prompt from "~/components/prompt";
import { useCallback, useState } from "react";
import { DEFAULT_USER } from "~/lib/constants";
import clearHandler from "~/lib/commands/clear";
import resErrorHandler from "~/lib/commands/error";
import contentHandler from "~/lib/commands/content";
import InputWithCaret from "~/components/InputWithCaret";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { getAuthenticatedUser } from "~/lib/auth/auth.user.server";
import Processing from "~/components/processing";

export const meta: V2_MetaFunction = ({
  data: { user },
}: {
  data: { user: ShareableUser };
}): V2_MetaDescriptor[] => {
  const { name }: ShareableUser = user;
  return [{ title: `${name}@phew` }];
};

export async function loader({ request }: LoaderArgs) {
  let user: ShareableUser =
    (await getAuthenticatedUser({ request })) || DEFAULT_USER;
  return json({ user });
}

export default function Home(): JSX.Element {
  const [cmd, setCmd] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const userFetcher = useFetcher<{ user: ShareableUser }>();

  useEffect((): void => {
    if (userFetcher.state === "idle" && userFetcher.data == null) {
      userFetcher.load("/login");
    }
  }, [userFetcher]);
  const loaderUser: ShareableUser = useLoaderData<typeof loader>().user;

  const user: ShareableUser = userFetcher.data?.user || loaderUser;

  const fetchHandler: ({
    url,
    opts,
  }: {
    url?: string | undefined;
    opts?: RequestInit | undefined;
  }) => Promise<CMDResponse> = useCallback(
    ({
      url = "/command",
      opts = {
        method: "POST",
        body: JSON.stringify({ cmd }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    }: {
      url?: string;
      opts?: RequestInit;
    }): Promise<CMDResponse> => {
      return new Promise(
        (
          resolve: (value: CMDResponse) => void,
          reject: (reason?: any) => void
        ): void => {
          fetch(url, opts)
            .then((res: Response): void => {
              res
                .json()
                .then((resData: CMDResponse): void => {
                  if (resData.success) {
                    const { data } = resData;
                    if (data.clear) {
                      setOutput(clearHandler(data));
                    } else if (data.content !== undefined) {
                      setOutput(
                        contentHandler({
                          cmd,
                          data,
                          user,
                          noPrompt: data.fetchForm === true,
                        })
                      );
                      console.log(data.fetchForm);
                    }
                    if (data.fetchForm && data.fetchForm !== true) {
                      setIsProcessing(true);
                      fetchHandler({
                        url: data.fetchForm,
                        opts: {
                          method: "POST",
                          body: new URLSearchParams(data.data),
                        },
                      })
                        .then(resolve)
                        .catch(reject);
                    } else {
                      resolve(resData);
                    }
                  } else {
                    const { errors, data } = resData;
                    setOutput(
                      resErrorHandler({
                        cmd,
                        errors,
                        user,
                        status: res.status,
                        noPrompt: data && data.fetchForm === true,
                      })
                    );
                    console.log(isProcessing);
                    setIsProcessing(false);
                    reject(errors);
                  }
                })
                .catch(reject);
            })
            .catch(reject);
        }
      );
    },
    [cmd, isProcessing, user]
  );

  const handleKeydown: (e: KeyboardEvent<HTMLInputElement>) => void =
    useCallback(
      (e: KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === "Enter") {
          fetchHandler({})
            .then((resData: CMDResponse): void => {
              if (resData.success) {
                if (resData.data.fetchForm === true) {
                  setIsProcessing(false);
                }
                if (resData.success && resData.data.updateUser) {
                  userFetcher.load("/login");
                }
              }
            })
            .catch((err): void => {
              console.error(err);
            })
            .finally((): void => {
              setCmd("");
            });
        }
      },
      [fetchHandler, userFetcher]
    );

  const [outputs, setOutput] = useState<ReactNode[]>([]);

  return (
    <div className={`flex grow px-2 py-1 md:px-4 md:py-3 w-full`}>
      <label className={`flex flex-col grow w-full`} htmlFor={`cmd`}>
        {outputs.map((output: ReactNode, idx: number): ReactNode => {
          return output;
        })}
        {!isProcessing ? (
          <InputWithCaret
            value={cmd}
            setValue={setCmd}
            type="text"
            name="cmd"
            id="cmd"
            autoFocus
            autoCapitalize={"none"}
            autoComplete={"false"}
            autoCorrect={"false"}
            onKeyDown={handleKeydown}
            propmtElement={<Prompt name={user.name} />}
          />
        ) : (
          <Processing />
        )}
      </label>
    </div>
  );
}
