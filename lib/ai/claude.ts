import Anthropic from "@anthropic-ai/sdk";

/**
 * Claude AI Extraction Service
 * Extracts actionable items from emails using Claude AI
 */

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ExtractedTask {
  type: "task";
  title: string;
  description: string;
  priority: "low" | "normal" | "urgent";
  category: "reply" | "follow_up" | "deadline" | "action_required";
  confidence: number; // 0.0 to 1.0
}

export interface ExtractedReceipt {
  type: "receipt";
  vendor: string;
  amount: number;
  currency: string;
  date: string; // ISO date string
  category:
    | "groceries"
    | "software"
    | "hardware"
    | "dining"
    | "travel"
    | "utilities"
    | "other";
  invoiceNumber?: string;
  confidence: number;
}

export interface ExtractedMeeting {
  type: "meeting";
  title: string;
  dateTime: string; // ISO datetime string
  duration: number; // minutes
  attendees: string[]; // email addresses
  description: string;
  confidence: number;
}

export type ExtractedItem = ExtractedTask | ExtractedReceipt | ExtractedMeeting;

export interface ExtractionResult {
  items: ExtractedItem[];
  summary: string;
  processingNotes?: string;
}

const EXTRACTION_PROMPT = `Extract actionable items from this email. Return JSON only.

Types:
1. Task (reply/follow-up/deadline/action_required) - priority: urgent/normal/low
2. Receipt (vendor, amount, currency, date, invoiceNumber) - category: groceries/software/hardware/dining/travel/utilities/other
3. Meeting (title, dateTime ISO format, duration mins, attendees emails)

Rules:
- Only extract clear actionable items
- Skip spam/newsletters/promos
- Confidence: 0.9-1.0 (clear), 0.7-0.89 (good), 0.5-0.69 (moderate)
- Use ONLY these priority values: "urgent", "normal", or "low"

Output format:
{"items": [{"type": "task", "title": "...", "description": "...", "priority": "normal", "category": "reply", "confidence": 0.9}], "summary": "Brief summary"}

Return empty array if no items: {"items": [], "summary": "No actionable items"}`;

/**
 * Extract actionable items from an email using Claude AI
 */
export async function extractFromEmail(email: {
  from: string;
  subject: string;
  body: string;
  date: string;
  hasAttachments: boolean;
  attachments?: Array<{ filename: string; mimeType: string }>;
}): Promise<ExtractionResult> {
  console.log(`[Claude] Extracting from email: ${email.subject}`);

  // Truncate email body to reduce token usage (max 1000 chars)
  const truncatedBody = email.body.length > 1000
    ? email.body.substring(0, 1000) + "..."
    : email.body;

  // Build email context (kept minimal to reduce tokens)
  const emailContext = `
From: ${email.from}
Subject: ${email.subject}
Date: ${email.date}
${email.hasAttachments ? `Attachments: ${email.attachments?.map((a) => a.filename).join(", ")}` : ""}

Body:
${truncatedBody}
`.trim();

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      temperature: 0.3, // Lower temperature for more consistent extraction
      messages: [
        {
          role: "user",
          content: `${EXTRACTION_PROMPT}\n\n---\n\nAnalyze this email and extract actionable items:\n\n${emailContext}`,
        },
      ],
    });

    // Parse response
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Extract JSON from response (handle potential markdown wrapping)
    let jsonText = content.text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    }

    const result = JSON.parse(jsonText) as ExtractionResult;

    console.log(
      `[Claude] Extracted ${result.items.length} items from email: ${email.subject}`
    );

    return result;
  } catch (error) {
    console.error("[Claude] Extraction error:", error);

    // Return empty result on error
    return {
      items: [],
      summary: "Extraction failed",
      processingNotes: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Extract from multiple emails in batch
 * Rate limited to stay within Anthropic API limits (50 requests/minute)
 */
export async function extractFromEmails(
  emails: Array<{
    from: string;
    subject: string;
    body: string;
    date: string;
    hasAttachments: boolean;
    attachments?: Array<{ filename: string; mimeType: string }>;
  }>
): Promise<ExtractionResult[]> {
  console.log(`[Claude] Batch extracting from ${emails.length} emails`);

  const results: ExtractionResult[] = [];

  // Process sequentially with 12 second delay to stay under token rate limits
  // 30K tokens/min means we need to spread requests to avoid hitting token cap
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    console.log(`[Claude] Processing email ${i + 1}/${emails.length}: ${email.subject}`);

    const result = await extractFromEmail(email);
    results.push(result);

    // Wait 12 seconds between requests to stay under token rate limit (30K tokens/min)
    if (i < emails.length - 1) {
      console.log(`[Claude] Waiting 12 seconds before next request...`);
      await new Promise((resolve) => setTimeout(resolve, 12000));
    }
  }

  const totalItems = results.reduce((sum, r) => sum + r.items.length, 0);
  console.log(`[Claude] Batch extraction complete: ${totalItems} total items`);

  return results;
}

/**
 * Validate extraction result
 */
export function validateExtraction(result: ExtractionResult): boolean {
  // Basic validation
  if (!result.items || !Array.isArray(result.items)) {
    return false;
  }

  // Validate each item
  for (const item of result.items) {
    if (!item.type || !item.confidence) {
      return false;
    }

    if (item.type === "task") {
      if (!item.title || !item.priority || !item.category) {
        return false;
      }
    } else if (item.type === "receipt") {
      if (!item.vendor || typeof item.amount !== "number" || !item.currency) {
        return false;
      }
    } else if (item.type === "meeting") {
      if (!item.title || !item.dateTime || !item.duration) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Filter items by confidence threshold
 */
export function filterByConfidence(
  items: ExtractedItem[],
  minConfidence: number = 0.7
): ExtractedItem[] {
  return items.filter((item) => item.confidence >= minConfidence);
}
