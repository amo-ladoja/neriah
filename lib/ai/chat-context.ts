/**
 * Chat Context Builder
 * Builds system prompt and context for Claude
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { Item, ChatMessage } from "@/lib/types/database";

const TASK_CATEGORIES = ["task", "reply", "follow_up", "deadline", "review"];
const RECEIPT_CATEGORIES = ["receipt", "invoice"];

interface ContextSummary {
  totalItems: number;
  tasks: number;
  receipts: number;
  meetings: number;
  urgentItems: number;
  recentSenders: string[];
  topCategories: string[];
}

/**
 * Build a summary of user's items for context
 */
async function buildItemsSummary(
  supabase: SupabaseClient,
  userId: string
): Promise<ContextSummary> {
  const { data } = await supabase
    .from("items")
    .select("category, priority, sender_name, receipt_category")
    .eq("user_id", userId)
    .eq("status", "pending")
    .limit(100);

  const items = (data || []) as Pick<Item, "category" | "priority" | "sender_name" | "receipt_category">[];

  const tasks = items.filter((i) => TASK_CATEGORIES.includes(i.category)).length;
  const receipts = items.filter((i) => RECEIPT_CATEGORIES.includes(i.category)).length;
  const meetings = items.filter((i) => i.category === "meeting").length;
  const urgentItems = items.filter((i) => i.priority === "urgent").length;

  // Get unique senders
  const senderCounts = new Map<string, number>();
  items.forEach((item) => {
    if (item.sender_name) {
      senderCounts.set(item.sender_name, (senderCounts.get(item.sender_name) || 0) + 1);
    }
  });
  const recentSenders = Array.from(senderCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  // Get top receipt categories
  const categoryCounts = new Map<string, number>();
  items.forEach((item) => {
    if (item.receipt_category) {
      categoryCounts.set(item.receipt_category, (categoryCounts.get(item.receipt_category) || 0) + 1);
    }
  });
  const topCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  return {
    totalItems: items.length,
    tasks,
    receipts,
    meetings,
    urgentItems,
    recentSenders,
    topCategories,
  };
}

/**
 * Fetch attached items for context
 */
export async function fetchAttachedItems(
  supabase: SupabaseClient,
  userId: string,
  itemIds: string[]
): Promise<Item[]> {
  if (!itemIds.length) return [];

  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", userId)
    .in("id", itemIds);

  return (data || []) as Item[];
}

/**
 * Build the system prompt for Claude
 */
export async function buildSystemPrompt(
  supabase: SupabaseClient,
  userId: string,
  attachedItems: Item[] = []
): Promise<string> {
  const summary = await buildItemsSummary(supabase, userId);

  let prompt = `You are Neriah, a helpful AI assistant that helps users manage their email inbox. You have access to the user's dashboard items (tasks, receipts, and meetings) extracted from their emails.

## User's Dashboard Summary
- Total pending items: ${summary.totalItems}
- Tasks: ${summary.tasks}
- Receipts: ${summary.receipts}
- Meetings: ${summary.meetings}
- Urgent items: ${summary.urgentItems}
${summary.recentSenders.length ? `- Frequent senders: ${summary.recentSenders.join(", ")}` : ""}
${summary.topCategories.length ? `- Top spending categories: ${summary.topCategories.join(", ")}` : ""}

## Your Capabilities
You have 4 tools available:
1. **query_items** - Search and filter dashboard items by type, priority, sender, date, or keywords
2. **calculate_spending** - Calculate spending totals from receipts, with optional grouping by category/vendor/month
3. **draft_email** - Generate AI-powered email reply drafts for specific items
4. **get_insights** - Get analytics and insights about items and spending patterns

## Guidelines
- Be concise and helpful
- Use tools when the user asks about their items, spending, or needs help drafting replies
- For simple questions like "how are you", respond directly without tools
- When showing items, summarize the results naturally
- For spending questions, use calculate_spending and provide the total with context
- For draft requests, use draft_email with the attached item (if any)
- If the user asks about their "biggest expense" or similar, use get_insights with category_breakdown`;

  // Add attached items context
  if (attachedItems.length > 0) {
    prompt += `\n\n## Currently Attached Items
The user has attached ${attachedItems.length} item(s) to this conversation:
`;
    attachedItems.forEach((item, i) => {
      prompt += `\n${i + 1}. **${item.title}** (ID: ${item.id})
   - Type: ${item.category}
   - From: ${item.sender_name || item.sender_email || "Unknown"}
   - Subject: ${item.email_subject || "N/A"}`;
      if (item.receipt_details?.amount) {
        prompt += `\n   - Amount: ${item.receipt_details.currency || "USD"} ${item.receipt_details.amount}`;
      }
    });
    prompt += `\n\nWhen the user asks to draft a reply or asks about "this item", use the attached item's ID.`;
  }

  return prompt;
}

/**
 * Format previous messages for conversation context
 */
export function formatMessageHistory(messages: ChatMessage[]): Array<{ role: "user" | "assistant"; content: string }> {
  return messages.slice(-10).map((msg) => ({
    role: msg.role,
    content: msg.content.text || JSON.stringify(msg.content),
  }));
}
