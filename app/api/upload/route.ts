import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/upload";

/**
 * Upload media file
 * POST /api/upload
 * 
 * Accepts multipart/form-data with:
 * - file: File
 * - type: 'image' | 'video'
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Only approved creators can upload
    if (user.role !== "creator" || user.creatorStatus !== "approved") {
      return NextResponse.json(
        { error: "Only approved creators can upload media" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!type || (type !== "image" && type !== "video")) {
      return NextResponse.json(
        { error: "Type must be 'image' or 'video'" },
        { status: 400 }
      );
    }

    // Save file
    const uploadResult = await saveUploadedFile(file, type as "image" | "video");

    return NextResponse.json({
      ...uploadResult,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

