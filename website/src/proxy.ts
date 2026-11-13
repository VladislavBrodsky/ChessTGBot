import { NextResponse, type NextRequest } from "next/server";
import { GEO_COOKIE } from "@/lib/config";
import { visitorCountry } from "@/lib/geoip";

export function proxy(request: NextRequest) {
  // This public site only serves documents and a GET feed. It has no Server
  // Actions or mutation routes; reject POST probes before React decodes them.
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new NextResponse(null, {
      status: 405,
      headers: { Allow: "GET, HEAD", "Cache-Control": "no-store" },
    });
  }

  const response = NextResponse.next();

  // Visitor country for the Consent Mode default in src/app/layout.tsx. gtag's
  // own region lookup (www.google.com/ccm/geo) is dropped by Brave and other
  // blockers, and gtag then applies region-scoped "denied" defaults to every
  // visitor, so the region is resolved here instead. Pages are static, hence a
  // cookie rather than inline markup.
  const country = visitorCountry(request.headers);
  if (country && request.cookies.get(GEO_COOKIE)?.value !== country) {
    response.cookies.set(GEO_COOKIE, country, {
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

export const config = {
  // /a3k is the Google tag gateway (src/app/a3k); its measurement hits are
  // POSTs that must reach the route handler.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|a3k(?:/|$)).*)"],
};
