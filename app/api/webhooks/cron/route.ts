import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  fetchRecentEmails,
  parseEmailForExtraction,
} from "@/lib/gmail/client";
import { extractFromEmail, filterByConfidence } from "@/lib/ai/claude";

/**
 * Cron Webhook Endpoint
 * POST /api/webhooks/cron
 *
 * Scheduled to run every 3 hours via Vercel Cron
 * - Fetches new emails for all active users
 * - Extracts actionable items using Claude
 * - Stores new items in Supabase
 * - Prevents duplicates
 *
 * Security: Vercel Cron automatically includes auth headers
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
    // Verify cron secret (optional extra security)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Cron] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron] Starting scheduled sync for all users");

    // Create Supabase admin client (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get all users with sync enabled who have completed initial extraction
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, last_sync_at")
      .eq("sync_enabled", true)
      .eq("initial_extraction_completed", true);

    if (profilesError) {
      console.error("[Cron] Error fetching profiles:", profilesError);
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      console.log("[Cron] No active users to sync");
      return NextResponse.json({
        success: true,
        message: "No active users to sync",
        usersSynced: 0,
      });
    }

    console.log(`[Cron] Found ${profiles.length} users to sync`);

    const results = {
      successful: 0,
      failed: 0,
      totalItems: 0,
    };

    // Process users sequentially to avoid overwhelming APIs
    for (const profile of profiles) {
      try {
        console.log(`[Cron] Syncing user: ${profile.email}`);

        // Create sync log
        const { data: syncLog } = await supabase
          .from("sync_logs")
          .insert({
            user_id: profile.id,
            sync_type: "scheduled",
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

        // Calculate days since last sync (default to 1 day, max 3)
        const daysSinceLastSync = profile.last_sync_at
          ? Math.ceil(
              (Date.now() - new Date(profile.last_sync_at).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 1;

        const daysToFetch = Math.min(daysSinceLastSync, 3); // Limit to 3 days for cron

        // Fetch emails
        const gmailMessages = await fetchRecentEmails(profile.id, daysToFetch);

        if (gmailMessages.length === 0) {
          // No new emails
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
            .eq("id", profile.id);

          console.log(`[Cron] No new emails for user: ${profile.email}`);
          results.successful++;
          continue;
        }

        // Parse emails
        const parsedEmails = gmailMessages.map(parseEmailForExtraction);

        // Extract with Claude
        const extractions = await Promise.all(
          parsedEmails.map((email) => extractFromEmail(email))
        );

        // Flatten and filter - attach email metadata to each item
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

        const filteredItems = filterByConfidence(allItems, 0.7);

        // Check for duplicates
        const { data: existingItems } = await supabase
          .from("items")
          .select("email_id")
          .eq("user_id", profile.id)
          .in(
            "email_id",
            parsedEmails.map((e) => e.messageId)
          );

        const existingEmailIds = new Set(
          existingItems?.map((item) => item.email_id) || []
        );

        // Prepare items to insert
        const itemsToInsert = [];

        for (const item of filteredItems) {
          const email = item._email;

          if (existingEmailIds.has(email.messageId)) {
            continue;
          }

          const senderName = email.from.match(/(.*?)\s*</)?.[1] || email.from;
          const senderEmail = email.from.match(/<(.+)>/)?.[1] || email.from;

          // Base item data
          const itemData: any = {
            user_id: profile.id,
            email_id: email.messageId,
            sender_email: senderEmail,
            sender_name: senderName || senderEmail,
            email_subject: email.subject,
            email_snippet: email.snippet,
            email_date: email.internalDate.toISOString(),
            has_attachment: email.attachments.length > 0,
            attachment_ids: email.attachments.map((a) => a.attachmentId).filter(Boolean) as string[],
            status: "pending",
            confidence: item.confidence,
            extraction_notes: item._summary,
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

        // Insert new items
        let insertedCount = 0;
        if (itemsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from("items")
            .insert(itemsToInsert);

          if (insertError) {
            throw insertError;
          }

          insertedCount = itemsToInsert.length;
        }

        // Update sync log
        await supabase
          .from("sync_logs")
          .update({
            status: "success",
            completed_at: new Date().toISOString(),
            emails_processed: gmailMessages.length,
            items_created: insertedCount,
          })
          .eq("id", syncLog.id);

        // Update profile
        await supabase
          .from("profiles")
          .update({ last_sync_at: new Date().toISOString() })
          .eq("id", profile.id);

        results.successful++;
        results.totalItems += insertedCount;

        console.log(
          `[Cron] Synced user ${profile.email}: ${insertedCount} new items`
        );
      } catch (userError) {
        console.error(`[Cron] Error syncing user ${profile.email}:`, userError);
        results.failed++;

        // Log the error in sync_logs if we have a log
        // This is best-effort, may not work if syncLog wasn't created
        try {
          const { data: lastLog } = await supabase
            .from("sync_logs")
            .select("id")
            .eq("user_id", profile.id)
            .eq("status", "running")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (lastLog) {
            await supabase
              .from("sync_logs")
              .update({
                status: "failed",
                completed_at: new Date().toISOString(),
                error_message:
                  userError instanceof Error
                    ? userError.message
                    : "Unknown error",
              })
              .eq("id", lastLog.id);
          }
        } catch (logError) {
          console.error("[Cron] Error updating sync log:", logError);
        }

        // Continue to next user
        continue;
      }

      // Add small delay between users to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(
      `[Cron] Sync complete. Successful: ${results.successful}, Failed: ${results.failed}, Total items: ${results.totalItems}`
    );

    return NextResponse.json({
      success: true,
      message: "Cron sync completed",
      stats: {
        usersProcessed: profiles.length,
        successful: results.successful,
        failed: results.failed,
        totalItemsExtracted: results.totalItems,
      },
    });
  } catch (error) {
    console.error("[Cron] Fatal error:", error);
    return NextResponse.json(
      {
        error: "Cron sync failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
