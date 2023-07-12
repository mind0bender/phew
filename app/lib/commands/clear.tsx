import type { ReactNode, SetStateAction } from "react";
import type { ParseCMDReturnType } from "~/routes/command/route";

import Output from "~/components/output";

export default function clearHandler(
  outData: ParseCMDReturnType
): SetStateAction<ReactNode[]> {
  if (!outData.content) {
    return [];
  }
  return [
    <Output key={0} noPrompt>
      {outData.content}
    </Output>,
  ];
}
