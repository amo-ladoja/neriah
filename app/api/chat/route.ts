/**
 * Unified LLM-Powered Chat Endpoint
 * Replaces /api/chat/query, /api/chat/calculate, /api/chat/draft
 */

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { chatTools } from "@/lib/ai/chat-tools";
import {
  handleQueryItems,
  handleCalculateSpending,
  handleDraftEmail,
  handleGetInsights,
} from "@/lib/ai/chat-handlers";
import {
  buildSystemPrompt,
  fetchAttachedItems,
  formatMessageHistory,
} from "@/lib/ai/chat-context";
import type {
  ChatRequest,
  ChatResponse,
  QueryItemsInput,
  CalculateSpendingInput,
  DraftEmailInput,
  GetInsightsInput,
  ItemCard,
} from "@/lib/types/chat";
import type { ChatMessage } from "@/lib/types/database";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse request
  const body: ChatRequest = await request.json().catch(() => ({
    message: "",
  }));
  const { message, chatId, attachedItemIds = [] } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    // Fetch attached items for context
    const attachedItems = await fetchAttachedItems(supabase, user.id, attachedItemIds);

    // Build system prompt with user context
    const systemPrompt = await buildSystemPrompt(supabase, user.id, attachedItems);

    // Fetch previous messages if chatId provided
    let previousMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
    if (chatId) {
      const { data: chatMessages } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (chatMessages) {
        previousMessages = formatMessageHistory(chatMessages as ChatMessage[]);
      }
    }

    // Build messages array for Claude
    const messages: Anthropic.MessageParam[] = [
      ...previousMessages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Initial Claude call with tools
    let response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      system: systemPrompt,
      tools: chatTools,
      messages,
    });

    // Process tool calls in a loop (handle multiple rounds if needed)
    const toolResults: Array<{ name: string; result: unknown }> = [];
    let maxIterations = 3;

    while (response.stop_reason === "tool_use" && maxIterations > 0) {
      maxIterations--;

      // Find tool use blocks
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );

      // Execute each tool
      const toolResultContents: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        let result: unknown;

        switch (toolUse.name) {
          case "query_items":
            result = await handleQueryItems(
              supabase,
              user.id,
              toolUse.input as QueryItemsInput
            );
            break;
          case "calculate_spending":
            result = await handleCalculateSpending(
              supabase,
              user.id,
              toolUse.input as CalculateSpendingInput
            );
            break;
          case "draft_email":
            result = await handleDraftEmail(
              supabase,
              user.id,
              toolUse.input as DraftEmailInput,
              anthropic
            );
            break;
          case "get_insights":
            result = await handleGetInsights(
              supabase,
              user.id,
              toolUse.input as GetInsightsInput
            );
            break;
          default:
            result = { error: "Unknown tool" };
        }

        toolResults.push({ name: toolUse.name, result });
        toolResultContents.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      }

      // Continue conversation with tool results
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 2000,
        system: systemPrompt,
        tools: chatTools,
        messages: [
          ...messages,
          { role: "assistant", content: response.content },
          { role: "user", content: toolResultContents },
        ],
      });
    }

    // Extract final text response
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    const responseText = textBlock?.text || "I wasn't able to process that request.";

    // Build response based on tools used
    const chatResponse = buildChatResponse(responseText, toolResults);

    return NextResponse.json(chatResponse);
  } catch (error) {
    console.error("[Chat API] Error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

/**
 * Build the chat response based on tool results
 */
function buildChatResponse(
  message: string,
  toolResults: Array<{ name: string; result: unknown }>
): ChatResponse {
  // Default to text response
  if (toolResults.length === 0) {
    return { message, kind: "text" };
  }

  // Find the primary tool result
  const lastTool = toolResults[toolResults.length - 1];

  switch (lastTool.name) {
    case "query_items": {
      const result = lastTool.result as { items: ItemCard[]; total: number };
      return {
        message,
        kind: "items",
        data: {
          items: result.items,
        },
      };
    }

    case "calculate_spending": {
      const result = lastTool.result as {
        total: number;
        currency: string;
        count: number;
        breakdown?: Array<{ label: string; amount: number; count: number }>;
        receipts: ItemCard[];
      };
      return {
        message,
        kind: "calc",
        data: {
          total: result.total.toFixed(2),
          currency: result.currency,
          count: result.count,
          breakdown: result.breakdown,
          receipts: result.receipts,
        },
      };
    }

    case "draft_email": {
      const result = lastTool.result as {
        draft: string;
        gmailUrl: string;
      };
      return {
        message,
        kind: "draft",
        data: {
          draft: result.draft,
          gmailUrl: result.gmailUrl,
        },
      };
    }

    case "get_insights": {
      const result = lastTool.result as {
        insight: string;
        data: Array<{ label: string; value: number | string; percentage?: number }>;
      };
      return {
        message,
        kind: "insight",
        data: {
          insight: result.insight,
          insightData: result.data,
        },
      };
    }

    default:
      return { message, kind: "text" };
  }
}
