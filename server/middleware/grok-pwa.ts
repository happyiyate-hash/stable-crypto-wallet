/**
 * Nitro global middleware for the small pieces of PWA chrome that must be
 * served dynamically.
 *
 * IMPORTANT: Nitro v3 middleware is a pre-route hook. It does not receive a
 * Express-style "next()" function and it must not wrap/transform the response
 * returned by the SSR renderer. Returning a value intentionally short-circuits
 * the request, so this middleware only returns a Response for the two special
 * PWA endpoints and otherwise returns undefined so TanStack Start/Nitro can
 * render the application normally.
 */
import installPageTemplate from "../../scripts/install-page.html?raw";
import { grokOgIdentity } from "virtual:grok-og-identity";
import {
  acceptsHtml,
  isDocumentPath,
  isInstallQuery,
  renderInstallPageHtml,
  renderWebManifest,
} from "../../scripts/grok-pwa-shared.mjs";

interface GrokPwaEvent {
  url: URL;
  req: { method: string; headers: Headers };
}

function requestHost(event: GrokPwaEvent): string {
  return (
    event.req.headers.get("x-forwarded-host") ?? event.req.headers.get("host") ?? event.url.host
  );
}

export default async function grokPwaMiddleware(event: GrokPwaEvent): Promise<Response | undefined> {
  const method = (event.req.method ?? "GET").toUpperCase();
  if (method !== "GET") return undefined;

  const path = event.url.pathname;
  const urlWithQuery = path + event.url.search;
  const host = requestHost(event);

  if (path === "/__grok/manifest.webmanifest" || path === "/__grok/manifest.json") {
    return new Response(renderWebManifest(host), {
      headers: {
        "content-type": "application/manifest+json; charset=utf-8",
        "cache-control": "no-cache",
      },
    });
  }

  if (
    isInstallQuery(urlWithQuery) &&
    isDocumentPath(path) &&
    acceptsHtml(event.req.headers.get("accept"))
  ) {
    return new Response(
      renderInstallPageHtml(installPageTemplate, {
        host,
        url: urlWithQuery,
      }),
      {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-cache",
        },
      },
    );
  }

  // Normal document/static requests must continue to TanStack Start/Nitro's
  // own routing and SSR renderer. Nitro middleware has no next() callback.
  // Keep the OG identity import alive for the build-time virtual module and
  // avoid changing the existing app identity contract.
  void grokOgIdentity;

  return undefined;
}
