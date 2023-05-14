import type { SessionStorage } from "@remix-run/node";
import type { Session, SessionData } from "@remix-run/node";

import invariant from "tiny-invariant";
import { createCookieSessionStorage } from "@remix-run/node";

const AUTH_SECRET: string | undefined = process.env.AUTH_SECRET;
const sessionCookieName: string = "_session";

invariant(AUTH_SECRET, "cannot find AUTH_SECRET");

export const sessionStorage: SessionStorage = createCookieSessionStorage({
  cookie: {
    name: sessionCookieName,
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [AUTH_SECRET],
    secure: process.env.NODE_ENV !== "production",
  },
});

export async function getSession(
  request: Request
): Promise<Session<SessionData, SessionData>> {
  return await sessionStorage.getSession(
    request.headers.get(sessionCookieName)
  );
}

export async function commitSession(session: Session): Promise<string> {
  return await sessionStorage.commitSession(session);
}
