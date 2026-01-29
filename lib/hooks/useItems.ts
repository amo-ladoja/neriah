import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database";

type Item = Database["public"]["Tables"]["items"]["Row"];

type FilterType = "all" | "tasks" | "receipts" | "meetings";

const TASK_CATEGORIES = ["task", "reply", "follow_up", "deadline", "review"];

export function useItems(filter: FilterType = "all") {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query
        let query = supabase
          .from("items")
          .select("*")
          .eq("status", "pending")
          .order("priority", { ascending: false })
          .order("email_date", { ascending: false });

        // Apply category filter based on filter type
        if (filter === "tasks") {
          query = query.in("category", TASK_CATEGORIES);
        } else if (filter === "receipts") {
          query = query.in("category", ["receipt", "invoice"]);
        } else if (filter === "meetings") {
          query = query.eq("category", "meeting");
        }
        // "all" has no filter

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setItems(data || []);
      } catch (err) {
        console.error("[useItems] Error fetching items:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch items");
      } finally {
        setLoading(false);
      }
    };

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
            const matchesFilter =
              newItem.status === "pending" &&
              (filter === "all" ||
                (filter === "tasks" && TASK_CATEGORIES.includes(newItem.category)) ||
                (filter === "receipts" && ["receipt", "invoice"].includes(newItem.category)) ||
                (filter === "meetings" && newItem.category === "meeting"));

            if (matchesFilter) {
              setItems((prev) => [newItem, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedItem = payload.new as Item;
            setItems((prev) =>
              prev.map((item) =>
                item.id === updatedItem.id ? updatedItem : item
              )
            );
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
  }, [filter]);

  return { items, loading, error };
}
