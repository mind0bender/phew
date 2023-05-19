import { useLoaderData } from "@remix-run/react";
import type { V2_MetaDescriptor } from "@remix-run/node";
import { json } from "@remix-run/node";
import type { LoaderArgs, V2_MetaFunction } from "@remix-run/node";

import InputWithCaret from "~/components/InputWithCaret";
import { useCallback, useState } from "react";
import type { ReactNode, KeyboardEvent } from "react";
import Prompt from "~/components/prompt";
import { DEFAULT_USER } from "~/lib/constants";
import { getAuthenticatedUser } from "~/lib/auth/auth.user.server";
import type { ShareableUser } from "~/lib/auth/shareable.user";
import type { ActionReturnType } from "~/utils/actionhelper";
import type { CommandActionData, ParseCMDReturnType } from "../command/route";
import Output from "~/components/output";
import clearHandler from "~/lib/commands/clear";

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
  const [value, setValue] = useState<string>("");
  const { user } = useLoaderData<typeof loader>();

  const handleKeydown: (e: KeyboardEvent<HTMLInputElement>) => void =
    useCallback(
      (e: KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === "Enter") {
          const cmd: string = value;
          setValue("");
          const commandActionData: CommandActionData = {
            cmd,
          };
          fetch("/command", {
            method: "POST",
            body: JSON.stringify(commandActionData),
            headers: {
              "Content-Type": "application/json",
            },
          })
            .then((res: Response): void => {
              res
                .json()
                .then((resData: ActionReturnType<ParseCMDReturnType>): void => {
                  if (resData.success) {
                    const { data } = resData;
                    console.log(data);
                    if (data.clear) {
                      setOutput(clearHandler(data));
                    } else if (data.content !== undefined) {
                      setOutput((prevOutputs: ReactNode[]): ReactNode[] => [
                        ...prevOutputs,
                        <Output
                          key={prevOutputs.length}
                          name={user.name}
                          cmd={cmd}>
                          {data.content}
                        </Output>,
                      ]);
                    }
                  } else {
                    console.error(resData.errors);
                  }
                })
                .catch(console.error);
            })
            .catch(console.error);
        }
      },
      [user.name, value]
    );

  const [outputs, setOutput] = useState<ReactNode[]>([]);

  return (
    <div className={`flex grow px-2 py-1 md:px-4 md:py-3 w-full`}>
      <label className={`flex flex-col grow w-full`} htmlFor={`cmd`}>
        {outputs.map((output: ReactNode, idx: number): ReactNode => {
          return output;
        })}
        <InputWithCaret
          value={value}
          setValue={setValue}
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
      </label>
    </div>
  );
}
