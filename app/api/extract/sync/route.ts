import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchRecentEmails,
  parseEmailForExtraction,
} from "@/lib/gmail/client";
import { extractFromEmail, filterByConfidence } from "@/lib/ai/claude";

/**
 * Manual Sync Endpoint
 * POST /api/extract/sync
 *
 * Allows users to manually trigger a sync to fetch new emails
 * - Fetches emails since last sync
 * - Extracts actionable items using Claude
 * - Stores new items in Supabase
 * - Prevents duplicates by checking email_id
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

    console.log(`[Sync] Starting sync for user: ${user.email}`);

    // Check if user has completed initial extraction
    const { data: profile } = await supabase
      .from("profiles")
      .select("initial_extraction_completed, last_sync_at")
      .eq("id", user.id)
      .single();

    if (!profile?.initial_extraction_completed) {
      return NextResponse.json(
        { error: "Initial extraction not completed. Please complete onboarding first." },
        { status: 400 }
      );
    }

    // Create sync log
    const { data: syncLog } = await supabase
      .from("sync_logs")
      .insert({
        user_id: user.id,
        sync_type: "manual",
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

    if (!syncLog) {
      throw new Error("Failed to create sync log");
    }

    try {
      // Calculate days since last sync (default to 1 day)
      const daysSinceLastSync = profile.last_sync_at
        ? Math.ceil((Date.now() - new Date(profile.last_sync_at).getTime()) / (1000 * 60 * 60 * 24))
        : 1;

      // Limit to max 7 days to avoid overwhelming the system
      const daysToFetch = Math.min(daysSinceLastSync, 7);

      console.log(`[Sync] Fetching emails from last ${daysToFetch} day(s)`);

      // Step 1: Fetch emails from Gmail
      const gmailMessages = await fetchRecentEmails(user.id, daysToFetch);
      console.log(`[Sync] Found ${gmailMessages.length} emails`);

      if (gmailMessages.length === 0) {
        // No new emails - update sync log and return
        await supabase
          .from("sync_logs")
          .update({
            status: "success",
            completed_at: new Date().toISOString(),
            emails_processed: 0,
            items_created: 0,
          })
          .eq("id", syncLog.id);

        await supabase
          .from("profiles")
          .update({ last_sync_at: new Date().toISOString() })
          .eq("id", user.id);

        return NextResponse.json({
          success: true,
          message: "No new emails found",
          itemsExtracted: 0,
        });
      }

      // Step 2: Parse emails for extraction
      console.log("[Sync] Parsing emails...");
      const parsedEmails = gmailMessages.map(parseEmailForExtraction);

      // Step 3: Extract items using Claude AI (batch processing)
      console.log("[Sync] Extracting actionable items with Claude...");
      const extractions = await Promise.all(
        parsedEmails.map((email) => extractFromEmail(email))
      );

      // Step 4: Flatten and filter results - attach email metadata to each item
      const allItems = extractions
        .flatMap((extraction, emailIndex) => {
          if (!extraction) return [];
          const email = parsedEmails[emailIndex];
          return extraction.items.map((extractedItem) => ({
            ...extractedItem,
            _email: email,
            _summary: extraction.summary,
          }));
        })
        .filter((item) => item !== null);

      // Filter by confidence (>= 0.7)
      const filteredItems = filterByConfidence(allItems, 0.7);

      console.log(
        `[Sync] Filtered ${filteredItems.length} items (from ${allItems.length} total)`
      );

      // Step 5: Check for existing items to prevent duplicates
      const { data: existingItems } = await supabase
        .from("items")
        .select("email_id")
        .eq("user_id", user.id)
        .in(
          "email_id",
          parsedEmails.map((e) => e.messageId)
        );

      const existingEmailIds = new Set(
        existingItems?.map((item) => item.email_id) || []
      );

      // Step 6: Store new items in database
      const itemsToInsert = [];

      for (const item of filteredItems) {
        const email = (item as any)._email;

        // Skip if already exists
        if (existingEmailIds.has(email.messageId)) {
          console.log(`[Sync] Skipping duplicate email: ${email.messageId}`);
          continue;
        }

        const senderName = email.from.match(/(.*?)\s*</)?.[1] || email.from;
        const senderEmail = email.from.match(/<(.+)>/)?.[1] || email.from;

        // Base item data
        const itemData: any = {
          user_id: user.id,
          email_id: email.messageId,
          sender_email: senderEmail,
          sender_name: senderName || senderEmail,
          email_subject: email.subject,
          email_snippet: email.snippet,
          email_date: email.internalDate.toISOString(),
          has_attachment: email.attachments.length > 0,
          attachment_ids: email.attachments.map((a: any) => a.attachmentId).filter(Boolean) as string[],
          status: "pending",
          confidence: item.confidence,
          extraction_notes: (item as any)._summary,
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
            itemData.extraction_notes = `${(item as any)._summary} | Invoice: ${item.invoiceNumber}`;
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
            location: "",
            topic: item.title,
          };
        }

        itemsToInsert.push(itemData);
      }

      // Insert all new items
      let insertedCount = 0;
      if (itemsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("items")
          .insert(itemsToInsert);

        if (insertError) {
          console.error("[Sync] Error inserting items:", insertError);
          throw insertError;
        }

        insertedCount = itemsToInsert.length;
        console.log(`[Sync] Inserted ${insertedCount} new items`);

        // Send push notification
        if (insertedCount > 0) {
          const { sendPushToUser } = await import("@/lib/push");
          await sendPushToUser(user.id, {
            title: "Neriah",
            body: `${insertedCount} new item${insertedCount > 1 ? "s" : ""} found in your emails`,
            badge: insertedCount,
            url: "/dashboard",
          });
        }
      } else {
        console.log("[Sync] No new items to insert (all were duplicates)");
      }

      // Step 7: Update sync log
      await supabase
        .from("sync_logs")
        .update({
          status: "success",
          completed_at: new Date().toISOString(),
          emails_processed: gmailMessages.length,
          items_created: insertedCount,
        })
        .eq("id", syncLog.id);

      // Update profile last sync time
      await supabase
        .from("profiles")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", user.id);

      console.log(`[Sync] Sync complete for user: ${user.email}`);

      return NextResponse.json({
        success: true,
        message: `Successfully processed ${gmailMessages.length} emails`,
        itemsExtracted: insertedCount,
        emailsProcessed: gmailMessages.length,
      });
    } catch (error) {
      // Update sync log with error
      await supabase
        .from("sync_logs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message:
            error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", syncLog.id);

      throw error;
    }
  } catch (error) {
    console.error("[Sync] Error:", error);
    return NextResponse.json(
      {
        error: "Sync failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
