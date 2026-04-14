import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/drive"],
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileName = formData.get("fileName") as string;
    const category = formData.get("category") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const accessToken = await auth.getAccessToken();
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const metadata = {
      name: `${category}__${fileName}__${file.name}`,
      parents: [process.env.GOOGLE_FOLDER_ID as string],
    };

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
      console.error("Failed to initiate upload:", errorText);
      return NextResponse.json(
        { error: "Failed to initiate upload" },
        { status: 500 }
      );
    }

    // Get the resumable upload URI from response headers
    const uploadUri = initiateResponse.headers.get("Location");
    
    if (!uploadUri) {
      return NextResponse.json(
        { error: "No upload URI received" },
        { status: 500 }
      );
    }

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
      console.error("Failed to upload file content:", errorText);
      return NextResponse.json(
        { error: "Failed to upload file content" },
        { status: 500 }
      );
    }

    const uploadedFile = await uploadResponse.json();

    // Step 3: Get file details including webViewLink
    const drive = google.drive({ version: "v3", auth });
    const fileDetails = await drive.files.get({
      fileId: uploadedFile.id,
      fields: "id, name, mimeType, createdTime, webViewLink, webContentLink",
    });

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
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
