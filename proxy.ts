import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Fast redirect for `/` before the RSC tree runs. Tokens are stored in
 * localStorage (see tokenManager), so the server cannot branch on auth here;
 * `/login` uses useAuthRedirect to send logged-in users to `/dashboard`.
 */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
