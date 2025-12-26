import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

// Define protected routes that require authentication
const protectedRoutes = ["/dashboard", "/profile", "/settings"];

// Define admin-only routes
const adminRoutes = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the auth token from cookies
  const token = request.cookies.get("auth_token")?.value;

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // If route is protected or admin route, verify authentication
  if (isProtectedRoute || isAdminRoute) {
    if (!token) {
      // Redirect to login if no token
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    try {
      // Verify the token (using edge-compatible jose)
      const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
      const role = typeof payload.role === "string" ? payload.role : null;

      // Check admin access for admin routes
      if (isAdminRoute && role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    } catch {
      // Invalid token, redirect to login
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Allow access
  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)",
  ],
};
