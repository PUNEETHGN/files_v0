import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request: NextRequest) {
  try {
    const { fileName, mimeType, category } = await request.json();

    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_FOLDER_ID) {
      return NextResponse.json(
        { error: "Google Drive credentials not configured" },
        { status: 500 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const accessToken = await auth.getAccessToken();

    // Create file metadata with category in description
    const fileMetadata = {
      name: fileName,
      parents: [process.env.GOOGLE_FOLDER_ID],
      description: `category:${category}`,
    };

    // Initialize resumable upload session
    const initResponse = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fileMetadata),
      }
    );

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error("[v0] Failed to init upload:", errorText);
      return NextResponse.json(
        { error: "Failed to initialize upload session" },
        { status: 500 }
      );
    }

    // Get the resumable upload URL
    const uploadUrl = initResponse.headers.get("location");

    if (!uploadUrl) {
      return NextResponse.json(
        { error: "Failed to get upload URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ uploadUrl });
  } catch (error) {
    console.error("[v0] Init upload error:", error);
    return NextResponse.json(
      { error: "Failed to initialize upload" },
      { status: 500 }
    );
  }
}
