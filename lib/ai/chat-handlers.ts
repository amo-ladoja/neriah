/**
 * Chat Tool Handlers
 * Execute Claude tool calls against the database
 */

import { SupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import {
  QueryItemsInput,
  CalculateSpendingInput,
  DraftEmailInput,
  GetInsightsInput,
  QueryItemsResult,
  CalculateSpendingResult,
  DraftEmailResult,
  GetInsightsResult,
  ItemCard,
  itemToCard,
} from "@/lib/types/chat";
import type { Item } from "@/lib/types/database";

const TASK_CATEGORIES = ["task", "reply", "follow_up", "deadline", "review"];
const RECEIPT_CATEGORIES = ["receipt", "invoice"];

/**
 * Handle query_items tool call
 */
export async function handleQueryItems(
  supabase: SupabaseClient,
  userId: string,
  input: QueryItemsInput
): Promise<QueryItemsResult> {
  let query = supabase
    .from("items")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending");

  // Type filter
  if (input.type && input.type !== "all") {
    if (input.type === "task") {
      query = query.in("category", TASK_CATEGORIES);
    } else if (input.type === "receipt") {
      query = query.in("category", RECEIPT_CATEGORIES);
    } else if (input.type === "meeting") {
      query = query.eq("category", "meeting");
    }
  }

  // Priority filter
  if (input.priority) {
    query = query.eq("priority", input.priority);
  }

  // Sender filter
  if (input.sender) {
    query = query.or(
      `sender_name.ilike.%${input.sender}%,sender_email.ilike.%${input.sender}%`
    );
  }

  // Date range filter
  if (input.dateRange?.start) {
    query = query.gte("email_date", input.dateRange.start);
  }
  if (input.dateRange?.end) {
    query = query.lte("email_date", input.dateRange.end);
  }

  // Search filter
  if (input.search) {
    const searchTerms = input.search.split(" ").filter(Boolean);
    const orFilters = searchTerms
      .map(
        (term) =>
          `title.ilike.%${term}%,description.ilike.%${term}%,email_subject.ilike.%${term}%`
      )
      .join(",");
    query = query.or(orFilters);
  }

  const limit = input.limit || 10;
  const { data, error } = await query
    .order("email_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[ChatHandler] Query items error:", error);
    return { items: [], total: 0 };
  }

  const items = (data as Item[]).map(itemToCard);
  return { items, total: items.length };
}

/**
 * Handle calculate_spending tool call
 */
export async function handleCalculateSpending(
  supabase: SupabaseClient,
  userId: string,
  input: CalculateSpendingInput
): Promise<CalculateSpendingResult> {
  let query = supabase
    .from("items")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .in("category", RECEIPT_CATEGORIES);

  // Category filter
  if (input.category) {
    query = query.eq("receipt_category", input.category);
  }

  // Vendor filter
  if (input.vendor) {
    query = query.ilike("receipt_details->>vendor", `%${input.vendor}%`);
  }

  // Date range filter
  if (input.dateRange?.start) {
    query = query.gte("email_date", input.dateRange.start);
  }
  if (input.dateRange?.end) {
    query = query.lte("email_date", input.dateRange.end);
  }

  const { data, error } = await query.order("email_date", { ascending: false });

  if (error) {
    console.error("[ChatHandler] Calculate spending error:", error);
    return { total: 0, currency: "USD", count: 0, receipts: [] };
  }

  const receipts = data as Item[];
  let total = 0;
  const currencies = new Set<string>();

  receipts.forEach((item) => {
    if (item.receipt_details?.amount) {
      total += item.receipt_details.amount;
      currencies.add(item.receipt_details.currency || "USD");
    }
  });

  const currency = currencies.size === 1 ? Array.from(currencies)[0] : "USD";

  // Calculate breakdown if requested
  let breakdown: CalculateSpendingResult["breakdown"];
  if (input.groupBy) {
    const groups = new Map<string, { amount: number; count: number }>();

    receipts.forEach((item) => {
      let key: string;
      if (input.groupBy === "category") {
        key = item.receipt_category || "other";
      } else if (input.groupBy === "vendor") {
        key = item.receipt_details?.vendor || "Unknown";
      } else if (input.groupBy === "month") {
        const date = item.receipt_details?.date || item.email_date;
        key = date ? new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Unknown";
      } else {
        key = "Other";
      }

      const existing = groups.get(key) || { amount: 0, count: 0 };
      groups.set(key, {
        amount: existing.amount + (item.receipt_details?.amount || 0),
        count: existing.count + 1,
      });
    });

    breakdown = Array.from(groups.entries())
      .map(([label, data]) => ({ label, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }

  return {
    total,
    currency,
    count: receipts.length,
    breakdown,
    receipts: receipts.slice(0, 5).map(itemToCard),
  };
}

/**
 * Handle draft_email tool call
 */
export async function handleDraftEmail(
  supabase: SupabaseClient,
  userId: string,
  input: DraftEmailInput,
  anthropic: Anthropic
): Promise<DraftEmailResult> {
  // Fetch the item
  const { data: item, error } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", userId)
    .eq("id", input.itemId)
    .maybeSingle();

  if (error || !item) {
    return {
      draft: "Unable to generate draft - item not found.",
      subject: "",
      gmailUrl: "https://mail.google.com/mail/u/0/#inbox",
    };
  }

  const typedItem = item as Item;

  // Build prompt for Claude to generate the draft
  const toneDesc = {
    professional: "formal and professional",
    friendly: "warm and friendly",
    apologetic: "apologetic and understanding",
    firm: "firm but polite",
  };

  const actionDesc = {
    accept: "accepting the request or invitation",
    decline: "politely declining the request or invitation",
    reschedule: "requesting to reschedule",
    followup: "following up on the matter",
    custom: "responding appropriately based on context",
  };

  const prompt = `Generate a concise email reply with the following context:

Original email from: ${typedItem.sender_name || typedItem.sender_email || "Unknown"}
Subject: ${typedItem.email_subject || typedItem.title}
Content summary: ${typedItem.email_snippet || typedItem.description || "No content available"}

Requirements:
- Tone: ${toneDesc[input.tone || "professional"]}
- Intent: ${actionDesc[input.action || "custom"]}
${input.keyPoints?.length ? `- Key points to include: ${input.keyPoints.join(", ")}` : ""}

Generate ONLY the email body text, no subject line or greeting format instructions. Keep it brief (2-4 sentences).`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    const draft = content.type === "text" ? content.text.trim() : "Unable to generate draft.";

    // Build Gmail URL for the original message
    const gmailUrl = typedItem.email_id
      ? `https://mail.google.com/mail/u/0/#all/${typedItem.email_id}`
      : "https://mail.google.com/mail/u/0/#inbox";

    return {
      draft,
      subject: `Re: ${typedItem.email_subject || typedItem.title}`,
      gmailUrl,
    };
  } catch (err) {
    console.error("[ChatHandler] Draft email error:", err);
    return {
      draft: `Hi ${typedItem.sender_name || "there"} — thanks for your note. I'll review this and get back to you shortly.`,
      subject: `Re: ${typedItem.email_subject || typedItem.title}`,
      gmailUrl: "https://mail.google.com/mail/u/0/#inbox",
    };
  }
}

/**
 * Handle get_insights tool call
 */
export async function handleGetInsights(
  supabase: SupabaseClient,
  userId: string,
  input: GetInsightsInput
): Promise<GetInsightsResult> {
  switch (input.insightType) {
    case "top_vendors": {
      let query = supabase
        .from("items")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pending")
        .in("category", RECEIPT_CATEGORIES);

      if (input.dateRange?.start) {
        query = query.gte("email_date", input.dateRange.start);
      }
      if (input.dateRange?.end) {
        query = query.lte("email_date", input.dateRange.end);
      }

      const { data } = await query;
      const items = (data || []) as Item[];

      const vendorTotals = new Map<string, number>();
      items.forEach((item) => {
        const vendor = item.receipt_details?.vendor || "Unknown";
        const amount = item.receipt_details?.amount || 0;
        vendorTotals.set(vendor, (vendorTotals.get(vendor) || 0) + amount);
      });

      const sorted = Array.from(vendorTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const total = sorted.reduce((sum, [, amt]) => sum + amt, 0);

      return {
        insight: `Your top spending vendors are ${sorted.map(([v]) => v).join(", ")}.`,
        data: sorted.map(([label, value]) => ({
          label,
          value,
          percentage: total > 0 ? Math.round((value / total) * 100) : 0,
        })),
      };
    }

    case "category_breakdown": {
      let query = supabase
        .from("items")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pending")
        .in("category", RECEIPT_CATEGORIES);

      if (input.dateRange?.start) {
        query = query.gte("email_date", input.dateRange.start);
      }
      if (input.dateRange?.end) {
        query = query.lte("email_date", input.dateRange.end);
      }

      const { data } = await query;
      const items = (data || []) as Item[];

      const categoryTotals = new Map<string, number>();
      items.forEach((item) => {
        const cat = item.receipt_category || "other";
        const amount = item.receipt_details?.amount || 0;
        categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + amount);
      });

      const sorted = Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1]);
      const total = sorted.reduce((sum, [, amt]) => sum + amt, 0);

      const topCategory = sorted[0]?.[0] || "none";
      return {
        insight: `Your biggest expense category is ${topCategory} at ${((sorted[0]?.[1] || 0) / 100).toFixed(2)} (${total > 0 ? Math.round(((sorted[0]?.[1] || 0) / total) * 100) : 0}% of total).`,
        data: sorted.map(([label, value]) => ({
          label,
          value,
          percentage: total > 0 ? Math.round((value / total) * 100) : 0,
        })),
      };
    }

    case "spending_trends": {
      let query = supabase
        .from("items")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pending")
        .in("category", RECEIPT_CATEGORIES);

      if (input.dateRange?.start) {
        query = query.gte("email_date", input.dateRange.start);
      }
      if (input.dateRange?.end) {
        query = query.lte("email_date", input.dateRange.end);
      }

      const { data } = await query;
      const items = (data || []) as Item[];

      const monthlyTotals = new Map<string, number>();
      items.forEach((item) => {
        const date = item.receipt_details?.date || item.email_date;
        if (date) {
          const month = new Date(date).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + (item.receipt_details?.amount || 0));
        }
      });

      const sorted = Array.from(monthlyTotals.entries());

      return {
        insight: `You have spending data for ${sorted.length} month(s).`,
        data: sorted.map(([label, value]) => ({ label, value })),
      };
    }

    case "pending_summary": {
      const { data } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pending");
      const items = (data || []) as Item[];

      const taskCount = items.filter((i) => TASK_CATEGORIES.includes(i.category)).length;
      const receiptCount = items.filter((i) => RECEIPT_CATEGORIES.includes(i.category)).length;
      const meetingCount = items.filter((i) => i.category === "meeting").length;
      const urgentCount = items.filter((i) => i.priority === "urgent").length;

      return {
        insight: `You have ${items.length} pending items: ${taskCount} tasks, ${receiptCount} receipts, ${meetingCount} meetings. ${urgentCount} marked urgent.`,
        data: [
          { label: "Tasks", value: taskCount },
          { label: "Receipts", value: receiptCount },
          { label: "Meetings", value: meetingCount },
          { label: "Urgent", value: urgentCount },
        ],
      };
    }

    default:
      return { insight: "Unknown insight type.", data: [] };
  }
}
