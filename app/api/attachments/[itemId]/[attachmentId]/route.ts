import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { downloadAttachment } from "@/lib/gmail/client";

/**
 * Detect MIME type from file magic bytes (file signature)
 * This is a fallback when Gmail doesn't provide proper metadata
 */
function detectMimeTypeFromBytes(buffer: Buffer): { mimeType: string; extension: string } {
  // PDF: %PDF (25 50 44 46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { mimeType: "application/pdf", extension: ".pdf" };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { mimeType: "image/png", extension: ".png" };
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { mimeType: "image/jpeg", extension: ".jpg" };
  }
  // GIF: GIF89a or GIF87a (47 49 46 38)
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return { mimeType: "image/gif", extension: ".gif" };
  }
  // WebP: RIFF....WEBP
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return { mimeType: "image/webp", extension: ".webp" };
  }
  // ZIP (also DOCX, XLSX, PPTX): PK (50 4B 03 04)
  if (buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return { mimeType: "application/zip", extension: ".zip" };
  }
  // Microsoft Office (DOC, XLS, PPT): D0 CF 11 E0
  if (buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0) {
    return { mimeType: "application/msword", extension: ".doc" };
  }
  return { mimeType: "application/octet-stream", extension: "" };
}

/**
 * GET /api/attachments/[itemId]/[attachmentId]
 * Fetches an email attachment from Gmail and returns it as a blob
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { itemId: string; attachmentId: string } }
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the item to verify ownership and get email_id
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("email_id, user_id")
      .eq("id", params.itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Verify user owns this item
    if (item.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Download attachment from Gmail
    const attachment = await downloadAttachment(
      user.id,
      item.email_id,
      params.attachmentId
    );

    console.log("[Attachment API] Gmail mimeType:", attachment.mimeType);
    console.log("[Attachment API] Gmail filename:", attachment.filename);
    console.log("[Attachment API] data length:", attachment.data?.length);

    // Convert URL-safe base64 to standard base64 (Gmail uses - and _ instead of + and /)
    const base64Data = attachment.data.replace(/-/g, "+").replace(/_/g, "/");
    const binaryData = Buffer.from(base64Data, "base64");

    // Detect mimeType from file content if Gmail didn't provide it
    let finalMimeType = attachment.mimeType;
    let finalFilename = attachment.filename;

    if (attachment.mimeType === "application/octet-stream" || !attachment.filename.includes(".")) {
      const detected = detectMimeTypeFromBytes(binaryData);
      console.log("[Attachment API] Detected from bytes:", detected);

      if (detected.mimeType !== "application/octet-stream") {
        finalMimeType = detected.mimeType;
        // Add extension if filename doesn't have one
        if (!finalFilename.includes(".") && detected.extension) {
          finalFilename = finalFilename + detected.extension;
        } else if (finalFilename === "attachment" && detected.extension) {
          finalFilename = "attachment" + detected.extension;
        }
      }
    }

    console.log("[Attachment API] Final mimeType:", finalMimeType);
    console.log("[Attachment API] Final filename:", finalFilename);

    // Return the file with appropriate headers
    return new NextResponse(binaryData, {
      status: 200,
      headers: {
        "Content-Type": finalMimeType,
        "Content-Disposition": `inline; filename="${finalFilename}"`,
        "Content-Length": binaryData.length.toString(),
      },
    });
  } catch (error) {
    console.error("[Attachment API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attachment" },
      { status: 500 }
    );
  }
}
