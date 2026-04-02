import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/favicon.ico"];
const DEMO_COOKIE_NAME = "ecosat_demo_user";

export function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/_next")) return NextResponse.next();
    if (pathname.startsWith("/api")) return NextResponse.next();
    if (pathname.startsWith("/_vercel")) return NextResponse.next();
    if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

    const hasSession = request.cookies.get(DEMO_COOKIE_NAME)?.value;
    if (hasSession) return NextResponse.next();

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("proxy error", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
