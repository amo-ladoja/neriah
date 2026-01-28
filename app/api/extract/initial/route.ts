import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchRecentEmails,
  parseEmailForExtraction,
} from "@/lib/gmail/client";
import { extractFromEmail, filterByConfidence } from "@/lib/ai/claude";

/**
 * Initial Extraction Endpoint
 * POST /api/extract/initial
 *
 * Triggers the first extraction for a new user
 * - Fetches last 24 hours of emails from Gmail
 * - Sends to Claude for extraction
 * - Stores items in Supabase
 * - Updates user's initial_extraction_completed flag
 */

// Helper function to normalize priority values to match database enum
function normalizePriority(priority: string): "urgent" | "high" | "medium" | "low" {
  const normalizedPriority = priority.toLowerCase();

  if (normalizedPriority === "urgent") return "urgent";
  if (normalizedPriority === "high") return "high";
  if (normalizedPriority === "medium" || normalizedPriority === "normal") return "medium";
  if (normalizedPriority === "low") return "low";
  return "medium";
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[Extract Initial] Starting extraction for user: ${user.email}`);

    // Check if already completed
    const { data: profile } = await supabase
      .from("profiles")
      .select("initial_extraction_completed")
      .eq("id", user.id)
      .single();

    if (profile?.initial_extraction_completed) {
      return NextResponse.json(
        { error: "Initial extraction already completed" },
        { status: 400 }
      );
    }

    // Create sync log
    const { data: syncLog, error: syncLogError } = await supabase
      .from("sync_logs")
      .insert({
        user_id: user.id,
        sync_type: "initial",
        started_at: new Date().toISOString(),
        completed_at: null,
        emails_processed: 0,
        items_created: 0,
        items_updated: 0,
        status: "running",
        error_message: null,
      })
      .select()
      .single();

    if (!syncLog || syncLogError) {
      console.error("[Extract Initial] Failed to create sync log:", syncLogError);
      throw new Error(
        `Failed to create sync log: ${syncLogError?.message || "Unknown error"}`
      );
    }

    try {
      // Step 1: Fetch emails from Gmail (last 1 day, limit to 5 emails to avoid rate limits)
      console.log("[Extract Initial] Fetching emails from Gmail...");
      const gmailMessages = await fetchRecentEmails(user.id, 1);

      // Limit to 5 emails to stay within API token limits
      const limitedMessages = gmailMessages.slice(0, 5);
      console.log(`[Extract Initial] Found ${gmailMessages.length} emails, processing ${limitedMessages.length}`);

      // Update sync log
      await supabase
        .from("sync_logs")
        .update({ emails_processed: limitedMessages.length })
        .eq("id", syncLog.id);

      // Step 2: Parse emails for extraction
      const parsedEmails = limitedMessages.map((msg) =>
        parseEmailForExtraction(msg)
      );

      // Step 2.5: Check for existing items to prevent duplicates
      const { data: existingItems } = await supabase
        .from("items")
        .select("email_id")
        .eq("user_id", user.id)
        .in("email_id", parsedEmails.map((e) => e.messageId));

      const existingEmailIds = new Set(
        existingItems?.map((item) => item.email_id) || []
      );

      // Step 3: Extract actionable items using Claude (with rate limiting)
      console.log("[Extract Initial] Extracting items with Claude AI...");
      let totalItemsCreated = 0;

      for (let i = 0; i < parsedEmails.length; i++) {
        const email = parsedEmails[i];

        // Skip emails already processed
        if (existingEmailIds.has(email.messageId)) {
          console.log(`[Extract Initial] Skipping already-processed email: ${email.subject}`);
          continue;
        }
        try {
          console.log(`[Extract Initial] Processing email ${i + 1}/${parsedEmails.length}: "${email.subject}"`);

          // Extract from email
          const extraction = await extractFromEmail({
            from: email.from,
            subject: email.subject,
            body: email.body,
            date: email.date,
            hasAttachments: email.hasAttachments,
            attachments: email.attachments,
          });

          // Filter by confidence (lowered to 0.5 for testing)
          const highConfidenceItems = filterByConfidence(
            extraction.items,
            0.5
          );

          // Deduplicate items from same email by type+title
          const seenKeys = new Set<string>();
          const uniqueItems = highConfidenceItems.filter((item: any) => {
            const key = `${item.type}:${item.title || item.vendor || ""}`;
            if (seenKeys.has(key)) return false;
            seenKeys.add(key);
            return true;
          });

          console.log(
            `[Extract Initial] Email "${email.subject}": ${uniqueItems.length} items extracted (${highConfidenceItems.length - uniqueItems.length} duplicates removed)`
          );

          // Step 4: Store items in database
          for (const item of uniqueItems) {
            try {
              // Parse sender email
              const senderMatch = email.from.match(/<(.+?)>/);
              const senderEmail = senderMatch ? senderMatch[1] : email.from;
              const senderName = email.from
                .replace(/<.+?>/, "")
                .trim()
                .replace(/"/g, "");

              // Base item data
              const itemData: any = {
                user_id: user.id,
                email_id: email.messageId,
                sender_email: senderEmail,
                sender_name: senderName || senderEmail,
                email_date: email.internalDate.toISOString(),
                status: "pending",
                confidence: item.confidence,
                extraction_notes: extraction.summary,
              };

              // Type-specific fields
              if (item.type === "task") {
                itemData.category = "task";
                itemData.title = item.title;
                itemData.description = item.description;
                itemData.priority = normalizePriority(item.priority);
              } else if (item.type === "receipt") {
                itemData.category = "receipt";
                itemData.title = `Receipt from ${item.vendor}`;
                itemData.description = `${item.currency} ${item.amount}`;
                itemData.receipt_category = item.category; // software, travel, medical, etc.
                itemData.receipt_details = {
                  vendor: item.vendor,
                  amount: item.amount,
                  currency: item.currency,
                  date: item.date,
                  invoiceNumber: item.invoiceNumber,
                };
                if (item.invoiceNumber) {
                  itemData.extraction_notes = `${extraction.summary} | Invoice: ${item.invoiceNumber}`;
                }
              } else if (item.type === "meeting") {
                itemData.category = "meeting"; // All meetings have category "meeting"
                itemData.title = item.title;
                itemData.description = item.description;
                itemData.priority = "medium";
                itemData.meeting_details = {
                  attendees: item.attendees || [],
                  suggestedTimes: item.dateTime ? [item.dateTime] : [],
                  duration: item.duration || 60,
                  topic: item.title,
                };
              }

              // Insert item
              const { error: insertError } = await supabase
                .from("items")
                .insert(itemData);

              if (insertError) {
                console.error(
                  "[Extract Initial] Error inserting item:",
                  insertError
                );
              } else {
                totalItemsCreated++;
              }
            } catch (itemError) {
              console.error(
                "[Extract Initial] Error processing item:",
                itemError
              );
            }
          }
        } catch (emailError) {
          console.error(
            `[Extract Initial] Error extracting from email "${email.subject}":`,
            emailError
          );
        }

        // Add delay between emails to respect both request and token rate limits
        // 30K tokens/min ÷ 5 emails = spread across 60 seconds = 12s between emails
        if (i < parsedEmails.length - 1) {
          console.log(`[Extract Initial] Waiting 12 seconds before next email...`);
          await new Promise((resolve) => setTimeout(resolve, 12000));
        }
      }

      console.log(
        `[Extract Initial] Extraction complete: ${totalItemsCreated} items created`
      );

      // Step 5: Update sync log and profile
      await supabase
        .from("sync_logs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          items_created: totalItemsCreated,
        })
        .eq("id", syncLog.id);

      await supabase
        .from("profiles")
        .update({
          initial_extraction_completed: true,
          last_sync_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      return NextResponse.json({
        success: true,
        emailsFetched: gmailMessages.length,
        itemsCreated: totalItemsCreated,
      });
    } catch (error) {
      // Update sync log with error
      await supabase
        .from("sync_logs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", syncLog.id);

      throw error;
    }
  } catch (error) {
    console.error("[Extract Initial] Error:", error);

    return NextResponse.json(
      {
        error: "Extraction failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
