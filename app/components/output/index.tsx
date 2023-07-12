import type { ReactNode } from "react";

import Prompt from "~/components/prompt";

type OutputProps =
  | {
      name: string;
      cmd: string;
      children: ReactNode;
      noPrompt?: false;
      pwd: string;
    }
  | {
      children: ReactNode;
      noPrompt: true;
    };

function Output({ children, ...outputProps }: OutputProps): JSX.Element {
  return (
    <>
      <div className={`flex`}>
        {!outputProps.noPrompt && (
          <div
            className={`flex w-full flex-wrap break-all whitespace-pre-wrap`}>
            <Prompt path={outputProps.pwd} name={outputProps.name} />
            {outputProps.cmd
              .split("")
              .map((char: string, idx: number): ReactNode => {
                return <span key={idx}>{char}</span>;
              })}
          </div>
        )}
      </div>
      <div className={`whitespace-pre-wrap`}>{children}</div>
    </>
  );
}

export default Output;
