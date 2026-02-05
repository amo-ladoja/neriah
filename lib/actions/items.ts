"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Mark an item as completed
 */
export async function markItemComplete(itemId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("items")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("[markItemComplete] Error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to mark complete",
    };
  }
}

/**
 * Snooze an item until a specific time
 */
export async function snoozeItem(
  itemId: string,
  snoozeUntil: Date
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("items")
      .update({
        status: "snoozed",
        snoozed_until: snoozeUntil.toISOString(),
      })
      .eq("id", itemId)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("[snoozeItem] Error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to snooze item",
    };
  }
}

/**
 * Delete an item (soft delete - marks as deleted)
 */
export async function deleteItem(itemId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("items")
      .update({
        status: "deleted",
      })
      .eq("id", itemId)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("[deleteItem] Error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to delete item",
    };
  }
}

/**
 * Delete all data for the current user
 */
export async function deleteAllUserData() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    // Delete all items
    await supabase.from("items").delete().eq("user_id", user.id);

    // Delete push subscriptions
    await supabase.from("push_subscriptions").delete().eq("user_id", user.id);

    // Delete sync logs
    await supabase.from("sync_logs").delete().eq("user_id", user.id);

    // Reset profile
    await supabase
      .from("profiles")
      .update({
        initial_extraction_completed: false,
        last_sync_at: null,
      })
      .eq("id", user.id);

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("[deleteAllUserData] Error:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete user data",
    };
  }
}

/**
 * Submit feedback for an item
 */
export async function submitFeedback(
  itemId: string,
  helpful: boolean,
  comment?: string
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    const updateData: any = {
      user_feedback: helpful ? "positive" : "negative",
      feedback_at: new Date().toISOString(),
    };

    if (comment) {
      updateData.feedback_comment = comment;
    }

    const { error } = await supabase
      .from("items")
      .update(updateData)
      .eq("id", itemId)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("[submitFeedback] Error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to submit feedback",
    };
  }
}
