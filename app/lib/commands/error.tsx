import type { ReactNode, SetStateAction } from "react";
import type { ActionError } from "~/utils/actionhelper";
import type { ShareableUser } from "~/lib/auth/shareable.user";

import Output from "~/components/output";

export default function resErrorHandler({
  user,
  cmd,
  errors,
  status,
  noPrompt,
  pwd,
}: {
  user: ShareableUser;
  cmd: string;
  errors: ActionError[];
  status: number;
  noPrompt?: boolean;
  pwd: string;
}): SetStateAction<ReactNode[]> {
  return (prevOutputs: ReactNode[]): ReactNode[] => [
    ...prevOutputs,
    <Output
      key={prevOutputs.length}
      noPrompt={noPrompt}
      name={user.name}
      cmd={cmd}
      pwd={pwd}>
      <div className={`text-red-500 font-semibold`}>
        -x-x- Server responded with {status} -x-x-
      </div>
      {errors.map((err: ActionError, idx: number): ReactNode => {
        return (
          <div
            className={`text-red-300`}
            key={idx}>{`[${err.code}] ${err.message}`}</div>
        );
      })}
    </Output>,
  ];
}
