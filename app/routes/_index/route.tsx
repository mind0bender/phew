// / <reference types="w3c-web-usb" />
// / <reference types="w3c-web-serial" />
import type { V2_MetaDescriptor } from "@remix-run/node";
import type { ShareableUser } from "~/lib/auth/shareable.user";
import type { CMDResponse, EditorData } from "../command/route";
import type { LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import type { ReactNode, KeyboardEvent, MutableRefObject } from "react";

import { ERR500 } from "~/lib/misc";
import { json } from "@remix-run/node";
import Prompt from "~/components/prompt";
import { useEffect, useRef } from "react";
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
  try {
    let user: ShareableUser =
      (await getAuthenticatedUser({ request })) || DEFAULT_USER;
    return json({ user });
  } catch (error) {
    console.error(error);
    throw error;
  }
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

  const [editorState, setEditorState] = useState<EditorData>();

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
    async ({
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
      try {
        const res: Response = await fetch(url, opts);
        const resData: CMDResponse = await res.json();
        if (resData.success) {
          const { data } = resData;
          if (data.clear) {
            setOutput(clearHandler(data));
          }
          setOutput(
            contentHandler({
              cmd: cmd.cmd,
              data,
              user,
              pwd,
              noPrompt: data.fetchForm === true,
            })
          );

          if (data.pwd) {
            setPwd(data.pwd);
          }
          if (data.editor) {
            setEditorState(data.editor);
          }
          if (data.fetchForm && data.fetchForm !== true) {
            setIsProcessing(true);
            return await fetchHandler({
              url: data.fetchForm,
              opts: {
                method: "POST",
                body: new URLSearchParams(data.data),
              },
            });
          } else {
            return resData;
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
          throw errors;
        }
      } catch (error) {
        console.error(error);
        return ERR500()[0];
      }
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
      async (e: KeyboardEvent<HTMLInputElement>): Promise<void> => {
        switch (e.key.toLowerCase()) {
          case "Enter".toLowerCase():
            try {
              const resData: CMDResponse = await fetchHandler({});
              if (resData.success) {
                if (resData.data.fetchForm === true) {
                  setIsProcessing(false);
                }
                if (resData.success && resData.data.updateUser) {
                  userFetcher.load("/login");
                }
              }
            } catch (err) {
              console.error(err);
            } finally {
              pushCMDInHistory();
            }
            break;
          case "Tab".toLowerCase():
            e.preventDefault();
            break;
          case "ArrowUp".toLowerCase():
            e.preventDefault();
            handleCMDHistoryNavigation(e.key);
            break;
          case "ArrowDown".toLowerCase():
            e.preventDefault();
            handleCMDHistoryNavigation(e.key);
            break;
          case "l":
            if (e.ctrlKey) {
              e.preventDefault();
              setOutput(
                clearHandler({
                  content: "",
                })
              );
            }
            break;
          default:
            break;
        }
      },
      [fetchHandler, handleCMDHistoryNavigation, userFetcher, pushCMDInHistory]
    );

  const belowInput: MutableRefObject<HTMLDivElement | null> =
    useRef<HTMLDivElement | null>(null);
  const [outputs, setOutput] = useState<ReactNode[]>([]);
  useEffect((): (() => void) => {
    belowInput.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
      inline: "end",
    });

    return (): void => {};
  }, [outputs, isProcessing]);

  return (
    <div className={`flex flex-col grow px-2 py-1 md:px-4 md:py-3 w-full`}>
      <label className={`flex gap-2 flex-col grow w-full`} htmlFor={`cmd`}>
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
            autoComplete={"off"}
            autoCorrect={"off"}
            onKeyDown={handleKeydown}
            propmtElement={<Prompt path={pwd} name={user.name} />}
          />
        ) : (
          <Processing />
        )}
        <div className={`w-full h-[calc(100vh-3.5rem)] sm:mt-2`}>
          {editorState ? (
            <span>
              <textarea name="editor" cols={30} rows={10}></textarea>
            </span>
          ) : (
            <div ref={belowInput} />
          )}
          {/* {JSON.stringify(CMDsHistory)}
          <br />
          {JSON.stringify(cmd)} */}
        </div>
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
