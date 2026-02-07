import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import {
  extractDateRange,
  extractItemKind,
  extractKeywords,
  extractNegations,
  extractPriority,
} from "@/lib/chat/queryParsing";

type ItemRow = Database["public"]["Tables"]["items"]["Row"];

function mapItemToCard(item: ItemRow) {
  const kind =
    item.category === "meeting"
      ? "meeting"
      : item.category === "receipt" || item.category === "invoice"
        ? "receipt"
        : "task";
  const sender = item.sender_email || item.sender_name || "Unknown sender";
  const subtitleParts = [
    item.priority ? item.priority.charAt(0).toUpperCase() + item.priority.slice(1) : null,
    sender ? `From ${sender}` : null,
  ].filter(Boolean);

  return {
    id: item.id,
    title: item.title,
    subtitle: subtitleParts.join(" · "),
    kind,
  };
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
  const queryText = typeof body?.text === "string" ? body.text : "";
  const negations = extractNegations(queryText);
  const keywords = extractKeywords(queryText, negations);
  const dateRange = extractDateRange(queryText);
  const itemKind = extractItemKind(queryText);
  const priority = extractPriority(queryText);

  let query = supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (itemKind === "receipt") {
    query = query.in("category", ["receipt", "invoice"]);
  } else if (itemKind === "meeting") {
    query = query.eq("category", "meeting");
  } else if (itemKind === "task") {
    query = query.in("category", ["task", "reply", "follow_up", "deadline", "review"]);
  }

  if (priority) {
    query = query.eq("priority", priority);
  }

  if (dateRange) {
    query = query.gte("email_date", dateRange.start.toISOString());
    query = query.lte("email_date", dateRange.end.toISOString());
  }

  if (keywords.length > 0) {
    const orFilters = keywords
      .map(
        (keyword) =>
          `title.ilike.%${keyword}%,description.ilike.%${keyword}%,sender_name.ilike.%${keyword}%,sender_email.ilike.%${keyword}%,email_subject.ilike.%${keyword}%`
      )
      .join(",");
    query = query.or(orFilters);
  }

  if (negations.length > 0) {
    negations.forEach((neg) => {
      query = query.not("title", "ilike", `%${neg}%`);
      query = query.not("email_subject", "ilike", `%${neg}%`);
      query = query.not("sender_name", "ilike", `%${neg}%`);
      query = query.not("sender_email", "ilike", `%${neg}%`);
    });
  }

  const { data, error } = await query
    .order("email_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }

  const items = (data || []).map(mapItemToCard);
  const message =
    items.length > 0
      ? "Here are a few matches from your dashboard."
      : "I couldn't find any matching items. Try a different query.";

  return NextResponse.json({
    kind: "items",
    message,
    items,
  });
}
