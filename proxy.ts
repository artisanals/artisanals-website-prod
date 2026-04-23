import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Proxy (formerly middleware) — runs on the server before
 * every matched route. This performs a fast, optimistic cookie-presence
 * check for /admin routes. The real secure check happens in the
 * admin server layout which validates the token against Convex.
 */
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only guard /admin routes
    if (pathname.startsWith("/admin")) {
        // Check for the presence of a Better Auth session cookie.
        // Better Auth sets a cookie named "better-auth.session_token"
        // (or "__Secure-better-auth.session_token" in production).
        const hasSession =
            request.cookies.has("better-auth.session_token") ||
            request.cookies.has("__Secure-better-auth.session_token");

        if (!hasSession) {
            return NextResponse.redirect(
                new URL("/authorisation-needed", request.url)
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
