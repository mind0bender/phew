import type { Session, SessionData, SessionStorage } from "@remix-run/node";

import invariant from "tiny-invariant";
import { createCookieSessionStorage } from "@remix-run/node";

const sessionCookieName = "_session";

invariant(process.env.AUTH_SECRET, "cannot find AUTH_SECRET");
export const AUTH_SECRET: string = process.env.AUTH_SECRET;

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
  try {
    return await sessionStorage.getSession(
      request.headers.get(sessionCookieName)
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function commitSession(session: Session): Promise<string> {
  try {
    return await sessionStorage.commitSession(session);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
