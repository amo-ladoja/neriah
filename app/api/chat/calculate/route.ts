import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import {
  extractCategory,
  extractDateRange,
  extractNegations,
  extractVendor,
} from "@/lib/chat/queryParsing";

type ItemRow = Database["public"]["Tables"]["items"]["Row"];

function mapReceipt(item: ItemRow) {
  const vendor = item.receipt_details?.vendor || "Unknown vendor";
  const amount = item.receipt_details?.amount;
  const currency = item.receipt_details?.currency || "USD";
  const dateLabel = item.receipt_details?.date || item.email_date?.split("T")[0] || "";
  const category = item.receipt_category || "other";

  return {
    id: item.id,
    title: `Receipt from ${vendor}`,
    subtitle: `${amount ? `$${amount.toFixed(2)}` : "Amount missing"} · ${
      category.charAt(0).toUpperCase() + category.slice(1)
    }${dateLabel ? ` · ${dateLabel}` : ""}`,
    kind: "receipt",
    currency,
    amount: amount ?? 0,
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const queryText = typeof body?.text === "string" ? body.text : "";
  const category = extractCategory(queryText);
  const vendor = extractVendor(queryText);
  const negations = extractNegations(queryText);
  const dateRange = extractDateRange(queryText);
  const startDate = dateRange?.start ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = dateRange?.end ?? new Date();

  let query = supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .in("category", ["receipt", "invoice"])
    .gte("email_date", startDate.toISOString())
    .lte("email_date", endDate.toISOString());

  if (category) {
    query = query.eq("receipt_category", category);
  }

  if (vendor) {
    query = query.ilike("receipt_details->>vendor", `%${vendor}%`);
  }

  if (negations.length > 0) {
    negations.forEach((neg) => {
      query = query.not("receipt_details->>vendor", "ilike", `%${neg}%`);
      query = query.not("email_subject", "ilike", `%${neg}%`);
    });
  }

  const { data, error } = await query
    .order("email_date", { ascending: false })
    .limit(5);

  if (error) {
    return NextResponse.json({ error: "Failed to calculate totals" }, { status: 500 });
  }

  const receipts = (data || []).map(mapReceipt);
  const total = receipts.reduce((sum, receipt) => sum + (receipt.amount || 0), 0);
  const currencies = new Set(receipts.map((receipt) => receipt.currency || "USD"));
  const currency = currencies.size === 1 ? receipts[0]?.currency || "USD" : "USD";

  return NextResponse.json({
    kind: "calc",
    message: receipts.length
      ? "Here is the total spend for the selected period."
      : "No receipts matched that query in the last 30 days.",
    total: total.toFixed(2),
    currency,
    receipts: receipts.map(({ amount, currency: _currency, ...rest }) => rest),
  });
}
