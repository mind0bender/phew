import type { EntryContext } from "@remix-run/node";

import isbot from "isbot";
import { PassThrough } from "node:stream";
import { Response } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToPipeableStream } from "react-dom/server";

const ABORT_DELAY = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
): Promise<Response> {
  return isbot(request.headers.get("user-agent"))
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      );
}

function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
): Promise<Response> {
  return new Promise(
    (
      resolve: (value: Response) => void,
      reject: (reason?: unknown) => void
    ): void => {
      const { pipe, abort } = renderToPipeableStream(
        <RemixServer
          context={remixContext}
          url={request.url}
          abortDelay={ABORT_DELAY}
        />,
        {
          onAllReady(): void {
            const body = new PassThrough();

            responseHeaders.set("Content-Type", "text/html");

            resolve(
              new Response(body, {
                headers: responseHeaders,
                status: responseStatusCode,
              })
            );

            pipe(body);
          },
          onShellError(error: unknown): void {
            reject(error);
          },
          onError(error: unknown): void {
            responseStatusCode = 500;
            console.error(error);
          },
        }
      );

      setTimeout(abort, ABORT_DELAY);
    }
  );
}

function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
): Promise<Response> {
  return new Promise(
    (
      resolve: (value: Response) => void,
      reject: (reason?: unknown) => void
    ): void => {
      const { pipe, abort } = renderToPipeableStream(
        <RemixServer
          context={remixContext}
          url={request.url}
          abortDelay={ABORT_DELAY}
        />,
        {
          onShellReady(): void {
            const body = new PassThrough();

            responseHeaders.set("Content-Type", "text/html");

            resolve(
              new Response(body, {
                headers: responseHeaders,
                status: responseStatusCode,
              })
            );

            pipe(body);
          },
          onShellError(error: unknown): void {
            reject(error);
          },
          onError(error: unknown): void {
            console.error(error);
            responseStatusCode = 500;
          },
        }
      );

      setTimeout(abort, ABORT_DELAY);
    }
  );
}
