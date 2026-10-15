import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // This public site only serves documents and a GET feed. It has no Server
  // Actions or mutation routes; reject POST probes before React decodes them.
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new NextResponse(null, {
      status: 405,
      headers: { Allow: "GET, HEAD", "Cache-Control": "no-store" },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
