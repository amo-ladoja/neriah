import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST: Add a message to a chat
export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify chat ownership
  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select("id")
    .eq("id", chatId)
    .eq("user_id", user.id)
    .single();

  if (chatError || !chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const { role, kind, content } = body;

  if (!role || !content) {
    return NextResponse.json({ error: "Role and content required" }, { status: 400 });
  }

  // Add message
  const { data: message, error: messageError } = await supabase
    .from("chat_messages")
    .insert({
      chat_id: chatId,
      role,
      kind: kind || "text",
      content,
    })
    .select()
    .single();

  if (messageError) {
    return NextResponse.json({ error: "Failed to add message" }, { status: 500 });
  }

  // Update chat's updated_at
  await supabase
    .from("chats")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", chatId);

  return NextResponse.json({ message });
}
