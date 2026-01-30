import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { downloadAttachment } from "@/lib/gmail/client";

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

    // Decode base64 data
    const binaryData = Buffer.from(attachment.data, "base64");

    // Return the file with appropriate headers
    return new NextResponse(binaryData, {
      status: 200,
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `inline; filename="${attachment.filename}"`,
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
