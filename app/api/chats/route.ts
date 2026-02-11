import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: List user's chats
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
  }

  return NextResponse.json({ chats: data || [] });
}

// POST: Create a new chat with first message
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
  const { title, message } = body;

  if (!title || !message) {
    return NextResponse.json({ error: "Title and message required" }, { status: 400 });
  }

  // Create chat
  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .insert({
      user_id: user.id,
      title: title.slice(0, 100), // Truncate to 100 chars
    })
    .select()
    .single();

  if (chatError || !chat) {
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
  }

  // Add first message
  const { error: messageError } = await supabase.from("chat_messages").insert({
    chat_id: chat.id,
    role: message.role,
    kind: message.kind || "text",
    content: message.content,
  });

  if (messageError) {
    // Clean up chat if message insert failed
    await supabase.from("chats").delete().eq("id", chat.id);
    return NextResponse.json({ error: "Failed to add message" }, { status: 500 });
  }

  return NextResponse.json({ chat });
}
