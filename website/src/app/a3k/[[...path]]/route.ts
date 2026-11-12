import type { NextRequest } from "next/server";
import { GA_GATEWAY_PATH, GA_MEASUREMENT_ID } from "@/lib/config";
import { visitorCountry } from "@/lib/geoip";

/**
 * Google tag gateway for advertisers (manual "Other CDN" setup):
 * https://developers.google.com/tag-platform/tag-manager/gateway/setup-guide
 *
 * Every request under /a3k is forwarded, path included, to the tag's
 * fps.goog origin. Google serves gtag.js from here and the tag then sends its
 * hits back through the same first-party path, so blockers that match
 * Google's domains no longer drop them. The path must stay in sync with
 * GA_GATEWAY_PATH in src/lib/config.ts.
 */

export const dynamic = "force-dynamic";

const ORIGIN = `https://${GA_MEASUREMENT_ID.toLowerCase()}.fps.goog`;

// Request headers worth forwarding. Everything else (including any
// client-sent X-Forwarded-Country* spoofing attempt) is dropped.
const FORWARD_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "content-type",
  "user-agent",
  "referer",
  "origin",
  "sec-ch-ua",
  "sec-ch-ua-arch",
  "sec-ch-ua-bitness",
  "sec-ch-ua-full-version-list",
  "sec-ch-ua-mobile",
  "sec-ch-ua-model",
  "sec-ch-ua-platform",
  "sec-ch-ua-platform-version",
  "sec-ch-ua-wow64",
];

// Only Google measurement cookies go upstream; the gateway discards others
// anyway, and this keeps unrelated first-party cookies off the wire.
const GOOGLE_COOKIE = /^(_ga|_ga_[\w-]+|_gid|_gcl_[\w-]+|FPID|FPLC|FPAU|FPGCL[\w-]*)$/;

// fetch() already decoded the body, so length/encoding no longer match.
const DROP_RESPONSE_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "transfer-encoding",
]);

function upstreamHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const cookies = request.cookies
    .getAll()
    .filter(({ name }) => GOOGLE_COOKIE.test(name))
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
  if (cookies) headers.set("cookie", cookies);

  // Google needs the visitor's country: it only sees this server's IP.
  const country = visitorCountry(request.headers);
  if (country) headers.set("x-forwarded-country", country);

  return headers;
}

async function forward(request: NextRequest): Promise<Response> {
  const { search } = request.nextUrl;
  // Next.js strips the trailing slash ("/a3k/?id=" 308s to "/a3k?id="), but
  // the gateway only serves the tag at "/a3k/".
  const pathname =
    request.nextUrl.pathname === GA_GATEWAY_PATH
      ? `${GA_GATEWAY_PATH}/`
      : request.nextUrl.pathname;
  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetch(`${ORIGIN}${pathname}${search}`, {
      method: request.method,
      headers: upstreamHeaders(request),
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.warn(
      "[tag-gateway] upstream request failed",
      pathname,
      error instanceof Error ? error.message : error,
    );
    return new Response(null, {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const headers = new Headers();
  upstream.headers.forEach((value, name) => {
    if (name === "set-cookie" || DROP_RESPONSE_HEADERS.has(name)) return;
    headers.set(name, value);
  });
  for (const cookie of upstream.headers.getSetCookie()) {
    headers.append("set-cookie", cookie);
  }

  // fetch() decoded Google's compressed gtag.js (~570 KB raw) and Next.js
  // does not compress route handler streams, so re-gzip text bodies.
  let body = upstream.body;
  const contentType = headers.get("content-type") ?? "";
  if (
    body &&
    /\bgzip\b/.test(request.headers.get("accept-encoding") ?? "") &&
    /javascript|json|^text\//.test(contentType)
  ) {
    body = body.pipeThrough(new CompressionStream("gzip"));
    headers.set("content-encoding", "gzip");
    if (!/accept-encoding/i.test(headers.get("vary") ?? "")) {
      headers.append("vary", "Accept-Encoding");
    }
  }

  return new Response(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

export const GET = forward;
export const HEAD = forward;
export const POST = forward;
export const OPTIONS = forward;
