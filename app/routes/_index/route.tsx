import type { V2_MetaDescriptor } from "@remix-run/react";
import type { V2_MetaFunction } from "@remix-run/node";

import InputWithCaret from "~/components/InputWithCaret";

export const meta: V2_MetaFunction = (): V2_MetaDescriptor[] => {
  const username: string = "stem";
  return [{ title: `${username}@phew` }];
};

// export async function loader({ request }: LoaderArgs) {
//   const user: ShareableUser | null = await getAuthenticatedUser({ request });
//   return user;
// }

export default function Home(): JSX.Element {
  return (
    <div className={`flex grow px-4 py-3 w-full`}>
      <label className={`flex grow w-full`} htmlFor={`CMDInp`}>
        <InputWithCaret
          type="text"
          name="CMDInp"
          id="CMDInp"
          autoCapitalize={"none"}
          autoComplete={"false"}
          autoCorrect={"false"}
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
