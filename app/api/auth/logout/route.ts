import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Clear the authentication cookie
    await clearAuthCookie();

    // Redirect to login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Logout error:", error);
    // Even on error, redirect to login
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}
