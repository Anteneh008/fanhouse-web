import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Clear the authentication cookie
    await clearAuthCookie();

    // Return success response - client will handle redirect
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    // Even on error, return success to allow redirect
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  }
}
