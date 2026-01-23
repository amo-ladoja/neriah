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
  priority: "low" | "medium" | "high" | "urgent";
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

const EXTRACTION_PROMPT = `You are an AI assistant that extracts actionable items from emails. Your job is to analyze an email and identify:

1. **Tasks**: Things that require action (reply needed, follow-ups, deadlines, action items)
2. **Receipts**: Invoices, purchase confirmations, payment receipts
3. **Meetings**: Meeting requests, calendar invites, scheduled calls

For each email, extract ALL actionable items and return them in a structured JSON format.

## Task Extraction Rules:
- Extract items that need a response or action
- Priority levels:
  - "urgent": Explicit urgency mentioned, immediate response needed
  - "high": Time-sensitive or from important contacts
  - "medium": Regular action items
  - "low": FYIs that might need eventual action

- Categories:
  - "reply": Needs a response/reply
  - "follow_up": Needs follow-up action
  - "deadline": Has a specific deadline
  - "action_required": Other action needed

## Receipt Extraction Rules:
- Look for: invoices, purchase confirmations, payment receipts
- Extract: vendor name, amount, currency, date, invoice number
- Categories: groceries, software, hardware, dining, travel, utilities, other
- Be precise with amounts (use numbers, not strings)

## Meeting Extraction Rules:
- Look for: meeting requests, calendar invites, scheduled calls
- Extract: title, date/time, duration, attendees
- Convert times to ISO format
- List attendee email addresses

## Confidence Scoring:
- 0.9-1.0: Very confident, clear and explicit
- 0.7-0.89: Confident, good indicators
- 0.5-0.69: Moderate, some ambiguity
- Below 0.5: Low confidence, might be false positive

## Output Format:
Return ONLY a valid JSON object with this structure:
{
  "items": [
    {
      "type": "task",
      "title": "Brief title",
      "description": "Detailed description",
      "priority": "high",
      "category": "reply",
      "confidence": 0.9
    },
    {
      "type": "receipt",
      "vendor": "Company Name",
      "amount": 99.99,
      "currency": "USD",
      "date": "2026-01-22",
      "category": "software",
      "invoiceNumber": "INV-12345",
      "confidence": 0.95
    },
    {
      "type": "meeting",
      "title": "Project sync",
      "dateTime": "2026-01-25T14:00:00Z",
      "duration": 30,
      "attendees": ["person@example.com"],
      "description": "Weekly project update",
      "confidence": 0.85
    }
  ],
  "summary": "Brief summary of what was extracted",
  "processingNotes": "Optional notes about extraction quality or ambiguities"
}

If an email has no actionable items, return:
{
  "items": [],
  "summary": "No actionable items found",
  "processingNotes": "This appears to be informational only"
}

Remember:
- Be conservative - only extract clear, actionable items
- Don't extract spam, newsletters, or promotional content
- Use confidence scores to indicate certainty
- Return ONLY valid JSON, no markdown or extra text`;

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

  // Build email context
  const emailContext = `
From: ${email.from}
Subject: ${email.subject}
Date: ${email.date}
Has Attachments: ${email.hasAttachments}
${
  email.attachments && email.attachments.length > 0
    ? `Attachments: ${email.attachments.map((a) => `${a.filename} (${a.mimeType})`).join(", ")}`
    : ""
}

Body:
${email.body}
`.trim();

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
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

  // Process in parallel with rate limiting (max 5 concurrent)
  const batchSize = 5;
  const results: ExtractionResult[] = [];

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((email) => extractFromEmail(email))
    );
    results.push(...batchResults);

    // Small delay between batches to avoid rate limits
    if (i + batchSize < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
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
