import type { ResWithInit } from "~/routes/command/route";

export default function CMDHelpHandler(): ResWithInit {
  return [
    {
      success: true,
      data: {
        // Type \`help name\` to find out about the function \`name\`.
        content: `PHEW
These commands are available.

A star (*) next to the name means that the command is only available for verified users.

help                            []
clear                           []
whoami                          []
login                           username[u] password[p]
signup                          username[u] email[e] password[p]
logout*                         []
ls*                             [files[f]]
mkdir*                          directories[d]
cd*                             [file]
touch*                          file`,
      },
    },
  ];
}
