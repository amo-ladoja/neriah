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
      // Step 1: Fetch emails from Gmail (last 2 days, limit to 10 emails)
      console.log("[Extract Initial] Fetching emails from Gmail...");
      const gmailMessages = await fetchRecentEmails(user.id, 2);

      // Limit to 10 emails to stay within API token limits
      const limitedMessages = gmailMessages.slice(0, 10);
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

      // Step 3: Filter out already-processed emails BEFORE LLM calls
      const emailsToProcess = parsedEmails.filter(
        (email) => !existingEmailIds.has(email.messageId)
      );

      console.log(
        `[Extract Initial] Processing ${emailsToProcess.length} new emails (${parsedEmails.length - emailsToProcess.length} already processed)`
      );

      if (emailsToProcess.length === 0) {
        console.log("[Extract Initial] No new emails to process");
        await supabase
          .from("sync_logs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            items_created: 0,
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
          itemsCreated: 0,
        });
      }

      // Step 4: Extract items in PARALLEL using Claude AI
      console.log("[Extract Initial] Extracting items with Claude AI (parallel)...");
      const extractions = await Promise.all(
        emailsToProcess.map((email) =>
          extractFromEmail({
            from: email.from,
            subject: email.subject,
            body: email.body,
            date: email.date,
            hasAttachments: email.hasAttachments,
            attachments: email.attachments,
          }).catch((err) => {
            console.error(`[Extract Initial] Error extracting "${email.subject}":`, err);
            return null;
          })
        )
      );

      // Step 5: Prepare all items for batch insert
      const itemsToInsert: any[] = [];

      extractions.forEach((extraction, index) => {
        if (!extraction) return;

        const email = emailsToProcess[index];

        // Filter by confidence (lowered to 0.5 for testing)
        const highConfidenceItems = filterByConfidence(extraction.items, 0.5);

        // Deduplicate items from same email by type+title
        const seenKeys = new Set<string>();
        const uniqueItems = highConfidenceItems.filter((item: any) => {
          const key = `${item.type}:${item.title || item.vendor || ""}`;
          if (seenKeys.has(key)) return false;
          seenKeys.add(key);
          return true;
        });

        console.log(
          `[Extract Initial] Email "${email.subject}": ${uniqueItems.length} items extracted`
        );

        // Build item data for each extracted item
        for (const item of uniqueItems) {
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
            has_attachment: email.attachments.length > 0,
            attachment_ids: email.attachments.map((a) => a.attachmentId).filter(Boolean) as string[],
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
            itemData.receipt_category = item.category;
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
            itemData.category = "meeting";
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

          itemsToInsert.push(itemData);
        }
      });

      // Step 6: Batch insert all items
      let totalItemsCreated = 0;
      if (itemsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("items")
          .insert(itemsToInsert);

        if (insertError) {
          console.error("[Extract Initial] Error inserting items:", insertError);
        } else {
          totalItemsCreated = itemsToInsert.length;
        }
      }

      console.log(
        `[Extract Initial] Extraction complete: ${totalItemsCreated} items created`
      );

      // Send push notification
      if (totalItemsCreated > 0) {
        const { sendPushToUser } = await import("@/lib/push");
        await sendPushToUser(user.id, {
          title: "Neriah",
          body: `${totalItemsCreated} new item${totalItemsCreated > 1 ? "s" : ""} extracted from your emails`,
          badge: totalItemsCreated,
          url: "/dashboard",
        });
      }

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
