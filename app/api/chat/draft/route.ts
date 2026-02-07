import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type ItemRow = Database["public"]["Tables"]["items"]["Row"];

function buildDraft(item: ItemRow | null) {
  if (!item) {
    return "Hi there — thanks for reaching out. I’m reviewing this now and will get back to you shortly. Please let me know if you have any additional context to share.";
  }

  const recipient = item.sender_name || "there";
  const subject = item.email_subject || item.title;
  return `Hi ${recipient} — thanks for your note about "${subject}". I'm on it and will follow up shortly. If you need anything else in the meantime, let me know.`;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const attachedItemIds: string[] = Array.isArray(body?.attachedItemIds)
    ? body.attachedItemIds
    : [];
  const targetId = attachedItemIds[0];

  let item: ItemRow | null = null;
  if (targetId) {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", user.id)
      .eq("id", targetId)
      .maybeSingle();
    if (!error) {
      item = data;
    }
  }

  return NextResponse.json({
    kind: "draft",
    message: "Here is a draft reply based on the attached item.",
    draft: buildDraft(item),
    gmailUrl: "https://mail.google.com/mail/u/0/#inbox",
  });
}
