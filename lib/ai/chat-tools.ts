/**
 * Claude Tool Definitions for Chat
 */

import Anthropic from "@anthropic-ai/sdk";

export const chatTools: Anthropic.Tool[] = [
  {
    name: "query_items",
    description:
      "Search and filter the user's dashboard items (tasks, receipts, meetings). Use this to find specific items based on type, priority, sender, date, or keywords.",
    input_schema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          enum: ["task", "receipt", "meeting", "all"],
          description: "Filter by item type. Use 'all' or omit for no type filter.",
        },
        priority: {
          type: "string",
          enum: ["urgent", "high", "medium", "low"],
          description: "Filter by priority level.",
        },
        sender: {
          type: "string",
          description: "Filter by sender name or email (partial match).",
        },
        dateRange: {
          type: "object",
          properties: {
            start: { type: "string", description: "Start date (ISO format)" },
            end: { type: "string", description: "End date (ISO format)" },
          },
        },
        limit: {
          type: "number",
          description: "Maximum number of items to return (default 10).",
        },
        search: {
          type: "string",
          description: "Search keywords to match in title or description.",
        },
      },
      required: [],
    },
  },
  {
    name: "calculate_spending",
    description:
      "Calculate total spending from the user's receipts. Can filter by category, vendor, or date range. Can also group results by category, vendor, or month.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          enum: ["software", "travel", "medical", "office", "meals", "utilities", "other"],
          description: "Filter receipts by category.",
        },
        vendor: {
          type: "string",
          description: "Filter by vendor name (partial match).",
        },
        dateRange: {
          type: "object",
          properties: {
            start: { type: "string", description: "Start date (ISO format)" },
            end: { type: "string", description: "End date (ISO format)" },
          },
        },
        groupBy: {
          type: "string",
          enum: ["category", "vendor", "month"],
          description: "Group results by this field to show breakdown.",
        },
      },
      required: [],
    },
  },
  {
    name: "draft_email",
    description:
      "Generate an AI-powered email reply draft for a specific item. The draft will be contextual based on the original email content.",
    input_schema: {
      type: "object" as const,
      properties: {
        itemId: {
          type: "string",
          description: "The ID of the item to draft a reply for.",
        },
        tone: {
          type: "string",
          enum: ["professional", "friendly", "apologetic", "firm"],
          description: "The tone of the email draft.",
        },
        keyPoints: {
          type: "array",
          items: { type: "string" },
          description: "Key points to include in the reply.",
        },
        action: {
          type: "string",
          enum: ["accept", "decline", "reschedule", "followup", "custom"],
          description: "The intended action/response type.",
        },
      },
      required: ["itemId"],
    },
  },
  {
    name: "get_insights",
    description:
      "Get analytics and insights about the user's items and spending patterns. Use this for summary statistics and trend analysis.",
    input_schema: {
      type: "object" as const,
      properties: {
        insightType: {
          type: "string",
          enum: ["top_vendors", "category_breakdown", "spending_trends", "pending_summary"],
          description:
            "Type of insight: top_vendors (biggest spending sources), category_breakdown (spending by category), spending_trends (monthly patterns), pending_summary (overview of pending tasks/items).",
        },
        dateRange: {
          type: "object",
          properties: {
            start: { type: "string", description: "Start date (ISO format)" },
            end: { type: "string", description: "End date (ISO format)" },
          },
        },
      },
      required: ["insightType"],
    },
  },
];
