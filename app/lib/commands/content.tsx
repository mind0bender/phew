import type { ReactNode, SetStateAction } from "react";
import type { ShareableUser } from "../auth/shareable.user";
import type { ParseCMDReturnType } from "~/routes/command/route";

import Output from "~/components/output";

export default function contentHandler({
  user,
  data,
  cmd,
  noPrompt,
}: {
  user: ShareableUser;
  data: ParseCMDReturnType;
  cmd: string;
  noPrompt?: boolean;
}): SetStateAction<ReactNode[]> {
  return (prevOutputs: ReactNode[]): ReactNode[] => [
    ...prevOutputs,
    <Output
      key={prevOutputs.length}
      noPrompt={noPrompt}
      name={user.name}
      cmd={cmd}>
      {data.content}
    </Output>,
  ];
}
