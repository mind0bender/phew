import type { ReactNode, SetStateAction } from "react";
import type { ShareableUser } from "~/lib/auth/shareable.user";
import type { ParseCMDReturnType } from "~/routes/command/route";

import Output from "~/components/output";

export default function contentHandler({
  user,
  data,
  cmd,
  pwd,
  noPrompt,
}: {
  user: ShareableUser;
  data: ParseCMDReturnType;
  cmd: string;
  pwd: string;
  noPrompt?: boolean;
}): SetStateAction<ReactNode[]> {
  return (prevOutputs: ReactNode[]): ReactNode[] => [
    ...prevOutputs,
    <Output
      key={prevOutputs.length}
      noPrompt={noPrompt}
      name={user.name}
      cmd={cmd}
      pwd={pwd}>
      {data.content}
    </Output>,
  ];
}
