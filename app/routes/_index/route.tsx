// / <reference types="w3c-web-usb" />
// / <reference types="w3c-web-serial" />
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
import Processing from "~/components/processing";
import resErrorHandler from "~/lib/commands/error";
import contentHandler from "~/lib/commands/content";
import InputWithCaret from "~/components/InputWithCaret";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { getAuthenticatedUser } from "~/lib/auth/auth.user.server";

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

interface CMD {
  id: number;
  cmd: string;
}

export default function Home(): JSX.Element {
  const [CMDsHistory, setCMDsHistory] = useState<CMD[]>([]);

  const [cmd, setCmd] = useState<CMD>({ id: 0, cmd: "" });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const userFetcher = useFetcher<{ user: ShareableUser }>();

  useEffect((): void => {
    if (userFetcher.state === "idle" && userFetcher.data == null) {
      userFetcher.load("/login");
    }
  }, [userFetcher]);
  const loaderUser: ShareableUser = useLoaderData<typeof loader>().user;

  const user: ShareableUser = userFetcher.data?.user || loaderUser;

  const [pwd, setPwd] = useState<string>("/");

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
        body: JSON.stringify({ cmd: cmd.cmd, pwd: pwd }),
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
                          cmd: cmd.cmd,
                          data,
                          user,
                          noPrompt: data.fetchForm === true,
                        })
                      );
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
                        cmd: cmd.cmd,
                        errors,
                        user,
                        status: res.status,
                        noPrompt: data && data.fetchForm === true,
                      })
                    );
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
    [cmd.cmd, pwd, user]
  );

  const handleCMDHistoryNavigation: (key: string) => void = useCallback(
    (key: string): void => {
      setCmd((pCMD: CMD): CMD => {
        switch (key) {
          case "ArrowUp":
            return CMDsHistory[pCMD.id - 1] || pCMD;
          case "ArrowDown":
            return CMDsHistory[pCMD.id + 1] || pCMD;
          default:
            return pCMD;
        }
      });
    },
    [CMDsHistory]
  );

  const pushCMDInHistory: () => void = useCallback((): void => {
    setCmd((pCMD: CMD): CMD => {
      if (
        !CMDsHistory.length ||
        CMDsHistory[CMDsHistory.length - 1].cmd !== pCMD.cmd
      ) {
        setCMDsHistory((pCMDsH: CMD[]): CMD[] => {
          return [...pCMDsH, pCMD];
        });
        return {
          id: pCMD.id + 1,
          cmd: "",
        };
      }
      return {
        id: pCMD.id,
        cmd: "",
      };
    });
  }, [CMDsHistory]);

  const handleKeydown: (e: KeyboardEvent<HTMLInputElement>) => void =
    useCallback(
      (e: KeyboardEvent<HTMLInputElement>): void => {
        switch (e.key) {
          case "Enter":
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
              .catch((err: unknown): void => {
                console.error(err);
              })
              .finally((): void => {
                pushCMDInHistory();
              });
            break;
          case "ArrowUp":
            e.preventDefault();
            handleCMDHistoryNavigation(e.key);
            break;
          case "ArrowDown":
            e.preventDefault();
            handleCMDHistoryNavigation(e.key);
            break;
          default:
            break;
        }
      },
      [fetchHandler, handleCMDHistoryNavigation, userFetcher, pushCMDInHistory]
    );

  const [outputs, setOutput] = useState<ReactNode[]>([]);

  return (
    <div className={`flex flex-col grow px-2 py-1 md:px-4 md:py-3 w-full`}>
      <label className={`flex flex-col grow w-full`} htmlFor={`cmd`}>
        {outputs.map((output: ReactNode, idx: number): ReactNode => {
          return output;
        })}
        {!isProcessing ? (
          <InputWithCaret
            value={cmd.cmd}
            setValue={(value: string): void => {
              setCmd({
                id: (CMDsHistory[CMDsHistory.length - 1] || { id: -1 }).id + 1,
                cmd: value,
              });
            }}
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

export function ErrorBoundary(): JSX.Element {
  return <div>Error</div>;
}
export function CatchBoundary(): JSX.Element {
  return <div>catch</div>;
}
