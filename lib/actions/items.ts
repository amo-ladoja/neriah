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
      feedback_helpful: helpful,
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
