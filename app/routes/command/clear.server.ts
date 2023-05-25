import type { ResWithInit } from "./route";

export default function CMDClearHandler(): ResWithInit {
  return [
    {
      success: true,
      data: {
        clear: true,
      },
    },
  ];
}
