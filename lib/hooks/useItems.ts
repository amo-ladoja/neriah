import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database";

type Item = Database["public"]["Tables"]["items"]["Row"];

type FilterType = "all" | "tasks" | "receipts" | "meetings" | "snoozed";

const TASK_CATEGORIES = ["task", "reply", "follow_up", "deadline", "review"];

export function useItems(filter: FilterType = "all") {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    const supabase = createClient();
    try {
      setLoading(true);
      setError(null);

      // Build query based on filter type
      let query = supabase.from("items").select("*");

      if (filter === "snoozed") {
        // Snoozed tab: show all snoozed items
        query = query
          .eq("status", "snoozed")
          .order("snoozed_until", { ascending: true });
      } else {
        // All other tabs: only show pending items
        query = query
          .eq("status", "pending")
          .order("priority", { ascending: false })
          .order("email_date", { ascending: false });

        // Apply category filter
        if (filter === "tasks") {
          query = query.in("category", TASK_CATEGORIES);
        } else if (filter === "receipts") {
          query = query.in("category", ["receipt", "invoice"]);
        } else if (filter === "meetings") {
          query = query.eq("category", "meeting");
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setItems(data || []);
    } catch (err) {
      console.error("[useItems] Error fetching items:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const supabase = createClient();
    fetchItems();

    // Set up realtime subscription
    const channel = supabase
      .channel("items-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
        },
        (payload) => {
          console.log("[useItems] Realtime update:", payload);

          if (payload.eventType === "INSERT") {
            const newItem = payload.new as Item;

            // Check if item matches current filter
            let matchesFilter = false;
            if (filter === "snoozed") {
              matchesFilter = newItem.status === "snoozed";
            } else {
              matchesFilter =
                newItem.status === "pending" &&
                (filter === "all" ||
                  (filter === "tasks" && TASK_CATEGORIES.includes(newItem.category)) ||
                  (filter === "receipts" && ["receipt", "invoice"].includes(newItem.category)) ||
                  (filter === "meetings" && newItem.category === "meeting"));
            }

            if (matchesFilter) {
              setItems((prev) => [newItem, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedItem = payload.new as Item;
            const expectedStatus = filter === "snoozed" ? "snoozed" : "pending";

            if (updatedItem.status !== expectedStatus) {
              // Item no longer belongs in this tab, remove it
              setItems((prev) => prev.filter((item) => item.id !== updatedItem.id));
            } else {
              setItems((prev) =>
                prev.map((item) =>
                  item.id === updatedItem.id ? updatedItem : item
                )
              );
            }
          } else if (payload.eventType === "DELETE") {
            const deletedItem = payload.old as Item;
            setItems((prev) => prev.filter((item) => item.id !== deletedItem.id));
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter, fetchItems]);

  return { items, loading, error, refetch: fetchItems };
}
