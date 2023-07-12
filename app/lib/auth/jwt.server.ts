import type { JwtPayload } from "jsonwebtoken";

import { verify, sign } from "jsonwebtoken";
import { AUTH_SECRET } from "~/lib/auth/session.server";

export { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
export type { JwtPayload } from "jsonwebtoken";

export function signJWT(
  data: string,
  expiresIn: number | string = "24h"
): string {
  const payload: JwtPayload = {
    data,
  };
  return sign(payload, AUTH_SECRET, {
    expiresIn,
  });
}

export function verifyJWT(token: string): string {
  const { data } = verify(token, AUTH_SECRET) as JwtPayload;
  return data;
}
