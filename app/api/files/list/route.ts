import { google } from "googleapis";
import { NextResponse } from "next/server";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

export async function GET() {
  try {
    const folderId = process.env.GOOGLE_FOLDER_ID as string;

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id, name, mimeType, createdTime, webViewLink, webContentLink)",
      orderBy: "createdTime desc",
    });

    const files = response.data.files?.map((file) => {
      const nameParts = file.name?.split("__") || [];
      const category = nameParts[0] || "Uncategorized";
      const displayName = nameParts[1] || file.name;
      const originalName = nameParts[2] || file.name;

      return {
        id: file.id,
        name: displayName,
        originalName: originalName,
        category: category,
        mimeType: file.mimeType,
        createdTime: file.createdTime,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
      };
    }) || [];

    return NextResponse.json({ files });
  } catch (error) {
    console.error("List error:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
