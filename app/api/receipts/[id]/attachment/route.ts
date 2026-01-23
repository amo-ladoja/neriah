import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Receipt Attachment Endpoint
 * GET /api/receipts/[id]/attachment
 *
 * Fetches a receipt attachment from Supabase Storage
 * - Verifies user owns the receipt
 * - Returns the file with proper content-type headers
 * - Supports PDFs and images
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = params.id;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user owns this item
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("id, user_id, email_id")
      .eq("id", itemId)
      .eq("user_id", user.id)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: "Receipt not found or access denied" },
        { status: 404 }
      );
    }

    // Get attachment info from receipt_attachments table
    const { data: attachment, error: attachmentError } = await supabase
      .from("receipt_attachments")
      .select("*")
      .eq("item_id", itemId)
      .single();

    if (attachmentError || !attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("receipts")
      .download(attachment.storage_path);

    if (downloadError || !fileData) {
      console.error("[Receipt Attachment] Download error:", downloadError);
      return NextResponse.json(
        { error: "Failed to download attachment" },
        { status: 500 }
      );
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Return file with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": attachment.file_type,
        "Content-Length": buffer.length.toString(),
        "Content-Disposition": `inline; filename="${attachment.file_name}"`,
        "Cache-Control": "private, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("[Receipt Attachment] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch attachment",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
