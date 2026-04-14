import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

// Required for Vercel serverless
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Validate required env variables
 */
function validateEnv() {
  const required = [
    "GOOGLE_CLIENT_EMAIL",
    "GOOGLE_PRIVATE_KEY",
    "GOOGLE_FOLDER_ID",
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing environment variable: ${key}`);
    }
  }
}

/**
 * Google Auth Client
 */
function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}

/**
 * Convert File → Stream
 */
async function fileToStream(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return Readable.from(buffer);
}

/**
 * API Handler
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    validateEnv();

    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const fileName = formData.get("fileName") as string | null;
    const category = formData.get("category") as string | null;

    if (!file || !fileName || !category) {
      return NextResponse.json(
        { error: "file, fileName, and category are required" },
        { status: 400 }
      );
    }

    // Optional: file size validation (recommended for Vercel)
    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File exceeds ${MAX_SIZE_MB}MB limit` },
        { status: 413 }
      );
    }

    const drive = getDriveClient();
    const stream = await fileToStream(file);

    const uploadResponse = await drive.files.create({
      requestBody: {
        name: `${category}__${fileName}__${file.name}`,
        parents: [process.env.GOOGLE_FOLDER_ID!],
      },
      media: {
        mimeType: file.type || "application/octet-stream",
        body: stream,
      },
      fields: "id, name, mimeType, createdTime, webViewLink, webContentLink",
    });

    const fileData = uploadResponse.data;

    return NextResponse.json({
      success: true,
      file: {
        id: fileData.id,
        name: fileName,
        originalName: file.name,
        category,
        mimeType: fileData.mimeType,
        createdTime: fileData.createdTime,
        webViewLink: fileData.webViewLink,
        webContentLink: fileData.webContentLink,
      },
      meta: {
        uploadTimeMs: Date.now() - startTime,
      },
    });

  } catch (error: any) {
    console.error("❌ Upload Error:", {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: "Upload failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
