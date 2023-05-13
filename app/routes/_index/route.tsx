import type { V2_MetaFunction } from "@remix-run/node";
import type { V2_MetaDescriptor } from "@remix-run/react";

export const meta: V2_MetaFunction = (): V2_MetaDescriptor[] => {
  return [{ title: "New Remix App" }];
};

export default function Index(): JSX.Element {
  return <div>Home</div>;
}
