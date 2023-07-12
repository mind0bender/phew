import type { ResWithInit } from "~/routes/command/route";

export default function CMDClearHandler(): ResWithInit {
  return [
    {
      success: true,
      data: {
        content: "",
        clear: true,
      },
    },
  ];
}
