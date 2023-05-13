import type { V2_MetaFunction } from "@remix-run/node";
import type { V2_MetaDescriptor } from "@remix-run/react";

import InputWithCaret from "~/components/InputWithCaret";

export const meta: V2_MetaFunction = (): V2_MetaDescriptor[] => {
  const username: string = "stem";
  return [{ title: `${username}@phew` }];
};

export default function Home(): JSX.Element {
  return (
    <div className={`flex grow px-4 py-3 w-full`}>
      <label
        className={`flex grow max-{value.slice(
          selection.isSelected ? selection.end : selection.start + 1
        )} w-full`}
        htmlFor={`CMDInp`}>
        <InputWithCaret
          type="text"
          name="CMDInp"
          id="CMDInp"
          propmtElement={
            <span>
              <span className={`text-primary-400 font-semibold`}>
                stem@phew
              </span>
              <span className={`pr-2`}>:/$</span>
            </span>
          }
        />
      </label>
    </div>
  );
}
