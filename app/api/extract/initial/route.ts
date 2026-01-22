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
    const { data: syncLog } = await supabase
      .from("sync_logs")
      .insert({
        user_id: user.id,
        sync_type: "initial",
        status: "running",
      })
      .select()
      .single();

    if (!syncLog) {
      throw new Error("Failed to create sync log");
    }

    try {
      // Step 1: Fetch emails from Gmail (last 24 hours)
      console.log("[Extract Initial] Fetching emails from Gmail...");
      const gmailMessages = await fetchRecentEmails(user.id, 1);
      console.log(`[Extract Initial] Found ${gmailMessages.length} emails`);

      // Update sync log
      await supabase
        .from("sync_logs")
        .update({ emails_fetched: gmailMessages.length })
        .eq("id", syncLog.id);

      // Step 2: Parse emails for extraction
      const parsedEmails = gmailMessages.map((msg) =>
        parseEmailForExtraction(msg)
      );

      // Step 3: Extract actionable items using Claude
      console.log("[Extract Initial] Extracting items with Claude AI...");
      let totalItemsCreated = 0;

      for (const email of parsedEmails) {
        try {
          // Extract from email
          const extraction = await extractFromEmail({
            from: email.from,
            subject: email.subject,
            body: email.body,
            date: email.date,
            hasAttachments: email.hasAttachments,
            attachments: email.attachments,
          });

          // Filter by confidence (only keep items >= 0.7)
          const highConfidenceItems = filterByConfidence(
            extraction.items,
            0.7
          );

          console.log(
            `[Extract Initial] Email "${email.subject}": ${highConfidenceItems.length} items extracted`
          );

          // Step 4: Store items in database
          for (const item of highConfidenceItems) {
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
                confidence: item.confidence,
                extraction_notes: extraction.summary,
              };

              // Type-specific fields
              if (item.type === "task") {
                itemData.category = item.category; // reply, follow_up, deadline, review
                itemData.title = item.title;
                itemData.description = item.description;
                itemData.priority = item.priority;
              } else if (item.type === "receipt") {
                itemData.category = "invoice"; // All receipts have category "invoice"
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
                itemData.priority = "medium"; // Default priority for meetings
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
