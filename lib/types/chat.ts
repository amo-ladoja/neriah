/**
 * Chat Types for LLM-powered chat
 */

import { Item, ReceiptCategory } from "./database";

// Tool input schemas
export interface QueryItemsInput {
  type?: "task" | "receipt" | "meeting" | "all";
  priority?: "urgent" | "high" | "medium" | "low";
  sender?: string;
  dateRange?: {
    start?: string; // ISO date
    end?: string;
  };
  limit?: number;
  search?: string;
}

export interface CalculateSpendingInput {
  category?: ReceiptCategory;
  vendor?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
  groupBy?: "category" | "vendor" | "month";
}

export interface DraftEmailInput {
  itemId: string;
  tone?: "professional" | "friendly" | "apologetic" | "firm";
  keyPoints?: string[];
  action?: "accept" | "decline" | "reschedule" | "followup" | "custom";
}

export interface GetInsightsInput {
  insightType: "top_vendors" | "category_breakdown" | "spending_trends" | "pending_summary";
  dateRange?: {
    start?: string;
    end?: string;
  };
}

// Tool result types
export interface QueryItemsResult {
  items: ItemCard[];
  total: number;
}

export interface CalculateSpendingResult {
  total: number;
  currency: string;
  count: number;
  breakdown?: Array<{
    label: string;
    amount: number;
    count: number;
  }>;
  receipts: ItemCard[];
}

export interface DraftEmailResult {
  draft: string;
  subject: string;
  gmailUrl: string;
}

export interface GetInsightsResult {
  insight: string;
  data: Array<{
    label: string;
    value: number | string;
    percentage?: number;
  }>;
}

// Shared types
export interface ItemCard {
  id: string;
  title: string;
  subtitle: string;
  kind: string;
}

// Chat response types
export type ChatResponseKind = "text" | "items" | "calc" | "draft" | "insight";

export interface ChatResponse {
  message: string;
  kind: ChatResponseKind;
  data?: {
    items?: ItemCard[];
    total?: string;
    currency?: string;
    count?: number;
    breakdown?: Array<{
      label: string;
      amount: number;
      count: number;
    }>;
    receipts?: ItemCard[];
    draft?: string;
    gmailUrl?: string;
    insight?: string;
    insightData?: Array<{
      label: string;
      value: number | string;
      percentage?: number;
    }>;
  };
}

// Chat request type
export interface ChatRequest {
  message: string;
  chatId?: string;
  attachedItemIds?: string[];
}

// Tool call types from Claude
export type ToolName = "query_items" | "calculate_spending" | "draft_email" | "get_insights";

export interface ToolCall {
  name: ToolName;
  input: QueryItemsInput | CalculateSpendingInput | DraftEmailInput | GetInsightsInput;
}

// Helper to convert DB Item to ItemCard
export function itemToCard(item: Item): ItemCard {
  let subtitle = item.sender_name || item.sender_email || "";

  if (item.category === "receipt" && item.receipt_details?.amount) {
    const amount = item.receipt_details.amount;
    const currency = item.receipt_details.currency || "USD";
    subtitle = `${currency} ${amount.toLocaleString()}`;
  } else if (item.category === "meeting" && item.meeting_details?.suggestedTimes?.[0]) {
    subtitle = new Date(item.meeting_details.suggestedTimes[0]).toLocaleDateString();
  }

  return {
    id: item.id,
    title: item.title,
    subtitle,
    kind: item.category,
  };
}
