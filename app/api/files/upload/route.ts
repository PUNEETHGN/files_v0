import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// App Router config for large file uploads
export const runtime = "nodejs";
export const maxDuration = 60;

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting file upload...");
    
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileName = formData.get("fileName") as string;
    const category = formData.get("category") as string;

    console.log("[v0] File received:", fileName, "Category:", category);

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_FOLDER_ID) {
      console.log("[v0] Missing environment variables");
      return NextResponse.json(
        { error: "Google Drive credentials not configured" },
        { status: 500 }
      );
    }

    const auth = getAuth();
    const accessToken = await auth.getAccessToken();
    
    console.log("[v0] Got access token");

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const metadata = {
      name: `${category}__${fileName}__${file.name}`,
      parents: [process.env.GOOGLE_FOLDER_ID as string],
    };

    console.log("[v0] Initiating resumable upload...");

    // Step 1: Initiate resumable upload session
    const initiateResponse = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": file.type || "application/octet-stream",
          "X-Upload-Content-Length": buffer.length.toString(),
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!initiateResponse.ok) {
      const errorText = await initiateResponse.text();
      console.error("[v0] Failed to initiate upload:", errorText);
      return NextResponse.json(
        { error: "Failed to initiate upload: " + errorText },
        { status: 500 }
      );
    }

    // Get the resumable upload URI from response headers
    const uploadUri = initiateResponse.headers.get("Location");
    
    if (!uploadUri) {
      console.error("[v0] No upload URI received");
      return NextResponse.json(
        { error: "No upload URI received" },
        { status: 500 }
      );
    }

    console.log("[v0] Uploading file content...");

    // Step 2: Upload file content to the resumable URI
    const uploadResponse = await fetch(uploadUri, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "Content-Length": buffer.length.toString(),
      },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("[v0] Failed to upload file content:", errorText);
      return NextResponse.json(
        { error: "Failed to upload file content: " + errorText },
        { status: 500 }
      );
    }

    const uploadedFile = await uploadResponse.json();
    console.log("[v0] File uploaded, getting details...");

    // Step 3: Get file details including webViewLink
    const drive = google.drive({ version: "v3", auth });
    const fileDetails = await drive.files.get({
      fileId: uploadedFile.id,
      fields: "id, name, mimeType, createdTime, webViewLink, webContentLink",
    });

    console.log("[v0] Upload complete:", fileDetails.data.id);

    return NextResponse.json({
      success: true,
      file: {
        id: fileDetails.data.id,
        name: fileName,
        originalName: file.name,
        category: category,
        mimeType: fileDetails.data.mimeType,
        createdTime: fileDetails.data.createdTime,
        webViewLink: fileDetails.data.webViewLink,
        webContentLink: fileDetails.data.webContentLink,
      },
    });
  } catch (error) {
    console.error("[v0] Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
