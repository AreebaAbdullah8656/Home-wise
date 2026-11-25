"use server";

import { revalidatePath } from "next/cache";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatAuthError, logAuthFailure } from "@/lib/supabase/errors";
import { getFxQuote } from "@/lib/currency/rates";
import { convertAmount, roundMoney } from "@/lib/currency/convert";
import type { Json } from "@/types/database";

export type CurrencyActionState = {
  error?: string;
  success?: string;
};

type Snapshot = {
  categories: { id: string; spending_limit: number | null }[];
  monthly_budgets: {
    id: string;
    total_amount: number;
    savings_allocation: number;
    emergency_allocation: number;
  }[];
  bills: { id: string; total_amount: number | null }[];
  bill_items: {
    id: string;
    unit_price: number | null;
    line_total: number | null;
  }[];
  expenses: { id: string; amount: number }[];
  savings_goals: {
    id: string;
    target_amount: number;
    allocated_amount: number;
    actual_amount: number;
  }[];
  emergency_funds: {
    id: string;
    target_amount: number;
    allocated_amount: number;
    actual_amount: number;
  }[];
  grocery_items: {
    id: string;
    estimated_price: number | null;
    actual_price: number | null;
  }[];
  inventory_items: { id: string; price: number | null }[];
};

function n(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

async function buildSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<Snapshot> {
  const [
    categories,
    monthly_budgets,
    bills,
    bill_items,
    expenses,
    savings_goals,
    emergency_funds,
    grocery_items,
    inventory_items,
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, spending_limit")
      .eq("user_id", userId),
    supabase
      .from("monthly_budgets")
      .select("id, total_amount, savings_allocation, emergency_allocation")
      .eq("user_id", userId),
    supabase.from("bills").select("id, total_amount").eq("user_id", userId),
    supabase
      .from("bill_items")
      .select("id, unit_price, line_total")
      .eq("user_id", userId),
    supabase.from("expenses").select("id, amount").eq("user_id", userId),
    supabase
      .from("savings_goals")
      .select("id, target_amount, allocated_amount, actual_amount")
      .eq("user_id", userId),
    supabase
      .from("emergency_funds")
      .select("id, target_amount, allocated_amount, actual_amount")
      .eq("user_id", userId),
    supabase
      .from("grocery_items")
      .select("id, estimated_price, actual_price")
      .eq("user_id", userId),
    supabase
      .from("inventory_items")
      .select("id, price")
      .eq("user_id", userId),
  ]);

  const firstError = [
    categories.error,
    monthly_budgets.error,
    bills.error,
    bill_items.error,
    expenses.error,
    savings_goals.error,
    emergency_funds.error,
    grocery_items.error,
    inventory_items.error,
  ].find(Boolean);

  if (firstError) {
    throw firstError;
  }

  return {
    categories: (categories.data ?? []).map((r) => ({
      id: r.id,
      spending_limit: n(r.spending_limit),
    })),
    monthly_budgets: (monthly_budgets.data ?? []).map((r) => ({
      id: r.id,
      total_amount: Number(r.total_amount ?? 0),
      savings_allocation: Number(r.savings_allocation ?? 0),
      emergency_allocation: Number(r.emergency_allocation ?? 0),
    })),
    bills: (bills.data ?? []).map((r) => ({
      id: r.id,
      total_amount: n(r.total_amount),
    })),
    bill_items: (bill_items.data ?? []).map((r) => ({
      id: r.id,
      unit_price: n(r.unit_price),
      line_total: n(r.line_total),
    })),
    expenses: (expenses.data ?? []).map((r) => ({
      id: r.id,
      amount: Number(r.amount ?? 0),
    })),
    savings_goals: (savings_goals.data ?? []).map((r) => ({
      id: r.id,
      target_amount: Number(r.target_amount ?? 0),
      allocated_amount: Number(r.allocated_amount ?? 0),
      actual_amount: Number(r.actual_amount ?? 0),
    })),
    emergency_funds: (emergency_funds.data ?? []).map((r) => ({
      id: r.id,
      target_amount: Number(r.target_amount ?? 0),
      allocated_amount: Number(r.allocated_amount ?? 0),
      actual_amount: Number(r.actual_amount ?? 0),
    })),
    grocery_items: (grocery_items.data ?? []).map((r) => ({
      id: r.id,
      estimated_price: n(r.estimated_price),
      actual_price: n(r.actual_price),
    })),
    inventory_items: (inventory_items.data ?? []).map((r) => ({
      id: r.id,
      price: n(r.price),
    })),
  };
}

async function applyScaledAmounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  snapshot: Snapshot,
  rate: number,
  toCurrency: string
) {
  const scale = (v: number | null) =>
    v == null ? null : roundMoney(convertAmount(v, rate), toCurrency);

  for (const row of snapshot.categories) {
    const { error } = await supabase
      .from("categories")
      .update({ spending_limit: scale(row.spending_limit) })
      .eq("id", row.id);
    if (error) throw error;
  }
  for (const row of snapshot.monthly_budgets) {
    const { error } = await supabase
      .from("monthly_budgets")
      .update({
        total_amount: scale(row.total_amount) ?? 0,
        savings_allocation: scale(row.savings_allocation) ?? 0,
        emergency_allocation: scale(row.emergency_allocation) ?? 0,
      })
      .eq("id", row.id);
    if (error) throw error;
  }
  for (const row of snapshot.bills) {
    const { error } = await supabase
      .from("bills")
      .update({ total_amount: scale(row.total_amount) })
      .eq("id", row.id);
    if (error) throw error;
  }
  for (const row of snapshot.bill_items) {
    const { error } = await supabase
      .from("bill_items")
      .update({
        unit_price: scale(row.unit_price),
        line_total: scale(row.line_total),
      })
      .eq("id", row.id);
    if (error) throw error;
  }
  for (const row of snapshot.expenses) {
    const { error } = await supabase
      .from("expenses")
      .update({ amount: scale(row.amount) ?? 0 })
      .eq("id", row.id);
    if (error) throw error;
  }
  for (const row of snapshot.savings_goals) {
    const { error } = await supabase
      .from("savings_goals")
      .update({
        target_amount: scale(row.target_amount) ?? 0,
        allocated_amount: scale(row.allocated_amount) ?? 0,
        actual_amount: scale(row.actual_amount) ?? 0,
      })
      .eq("id", row.id);
    if (error) throw error;
  }
  for (const row of snapshot.emergency_funds) {
    const { error } = await supabase
      .from("emergency_funds")
      .update({
        target_amount: scale(row.target_amount) ?? 0,
        allocated_amount: scale(row.allocated_amount) ?? 0,
        actual_amount: scale(row.actual_amount) ?? 0,
      })
      .eq("id", row.id);
    if (error) throw error;
  }
  for (const row of snapshot.grocery_items) {
    const { error } = await supabase
      .from("grocery_items")
      .update({
        estimated_price: scale(row.estimated_price),
        actual_price: scale(row.actual_price),
      })
      .eq("id", row.id);
    if (error) throw error;
  }
  for (const row of snapshot.inventory_items) {
    const { error } = await supabase
      .from("inventory_items")
      .update({ price: scale(row.price) })
      .eq("id", row.id);
    if (error) throw error;
  }
}

async function restoreSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  snapshot: Snapshot
) {
  for (const row of snapshot.categories) {
    const { error } = await supabase
      .from("categories")
      .update({ spending_limit: row.spending_limit })
      .eq("id", row.id);
    if (error) throw error;
  }
  for (const row of snapshot.monthly_budgets) {
    const { error } = await supabase
      .from("monthly_budgets")
      .update({
        total_amount: row.total_amount,
        savings_allocation: row.savings_allocation,
        emergency_allocation: row.emergency_allocation,
      })
      .eq("id", row.id);
    if (error) throw error;
  }
  for (const row of snapshot.bills) {
    const { error } = await supabase
      .from("bills")
      .update({ total_amount: row.total_amount })
      .eq("id", row.id);
    if (error) throw error;
  }
  for (const row of snapshot.bill_items) {
    const { error } = await supabase
      .from("bill_items")
      .update({
        unit_price: row.unit_price,
        line_total: row.line_total,
      })
      .eq("id", row.id);
    if (error) throw error;
  }
  for (const row of snapshot.expenses) {
    const { error } = await supabase
      .from("expenses")
      .update({ amount: row.amount })
      .eq("id", row.id);
    if (error) throw error;
  }
  for (const row of snapshot.savings_goals) {
    const { error } = await supabase
      .from("savings_goals")
      .update({
        target_amount: row.target_amount,
        allocated_amount: row.allocated_amount,
        actual_amount: row.actual_amount,
      })
      .eq("id", row.id);
    if (error) throw error;
  }
  for (const row of snapshot.emergency_funds) {
    const { error } = await supabase
      .from("emergency_funds")
      .update({
        target_amount: row.target_amount,
        allocated_amount: row.allocated_amount,
        actual_amount: row.actual_amount,
      })
      .eq("id", row.id);
    if (error) throw error;
  }
  for (const row of snapshot.grocery_items) {
    const { error } = await supabase
      .from("grocery_items")
      .update({
        estimated_price: row.estimated_price,
        actual_price: row.actual_price,
      })
      .eq("id", row.id);
    if (error) throw error;
  }
  for (const row of snapshot.inventory_items) {
    const { error } = await supabase
      .from("inventory_items")
      .update({ price: row.price })
      .eq("id", row.id);
    if (error) throw error;
  }
}

function revalidateMoneyPaths() {
  for (const path of [
    "/settings",
    "/dashboard",
    "/budget",
    "/expenses",
    "/bills",
    "/savings",
    "/grocery",
    "/inventory",
    "/reports",
    "/tips",
    "/",
  ]) {
    revalidatePath(path);
  }
  revalidatePath("/", "layout");
}

/**
 * Permanently rewrite stored amounts into the active display currency.
 * Saves a full snapshot so reverse restores exact originals (no compounding).
 */
export async function permanentlyConvertCurrency(
  _prev: CurrencyActionState,
  formData: FormData
): Promise<CurrencyActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured." };
  }

  const confirmed = String(formData.get("confirm") ?? "") === "CONVERT";
  if (!confirmed) {
    return {
      error: 'Type CONVERT in the confirmation field to permanently convert.',
    };
  }

  try {
    const user = await getSessionUser();
    if (!user) return { error: "Sign in required." };

    const supabase = await createClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("currency, amount_currency")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return { error: profileError?.message ?? "Profile not found." };
    }

    const toCurrency = (profile.currency || "PKR").toUpperCase();
    const fromCurrency = (profile.amount_currency || toCurrency).toUpperCase();

    if (fromCurrency === toCurrency) {
      return {
        success:
          "Stored amounts are already in your active currency — nothing to convert.",
      };
    }

    const quote = await getFxQuote(fromCurrency, toCurrency);
    if (!quote) {
      return {
        error:
          "No exchange rate available. Cannot permanently convert without a live or cached rate.",
      };
    }

    const snapshot = await buildSnapshot(supabase, user.id);

    const { data: event, error: eventError } = await supabase
      .from("currency_conversion_events")
      .insert({
        user_id: user.id,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        rate: quote.rate,
        provider: quote.provider,
        snapshot: snapshot as unknown as Json,
      })
      .select("id")
      .single();

    if (eventError) {
      // Table may not exist until migration is applied.
      logAuthFailure("permanentlyConvert.insertEvent", eventError);
      return {
        error: `${formatAuthError(eventError)} — run migration 20261125000007_currency_conversion.sql in Supabase SQL Editor.`,
      };
    }

    try {
      await applyScaledAmounts(supabase, snapshot, quote.rate, toCurrency);
      const { error: updErr } = await supabase
        .from("profiles")
        .update({
          amount_currency: toCurrency,
          currency: toCurrency,
        })
        .eq("id", user.id);
      if (updErr) throw updErr;
    } catch (applyError) {
      // Best-effort restore from snapshot if mid-flight failure.
      try {
        await restoreSnapshot(supabase, snapshot);
      } catch {
        /* ignore secondary */
      }
      if (event?.id) {
        await supabase
          .from("currency_conversion_events")
          .update({ reversed_at: new Date().toISOString() })
          .eq("id", event.id);
      }
      throw applyError;
    }

    revalidateMoneyPaths();
    return {
      success: `Permanently converted stored amounts from ${fromCurrency} to ${toCurrency} at rate 1 ${fromCurrency} = ${quote.rate} ${toCurrency}. You can reverse to restore exact originals.`,
    };
  } catch (error) {
    logAuthFailure("permanentlyConvert", error);
    return { error: formatAuthError(error) };
  }
}

/** Restore exact amounts from the latest unreversed permanent convert. */
export async function reversePermanentConvert(
  _prev: CurrencyActionState,
  _formData: FormData
): Promise<CurrencyActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured." };
  }

  try {
    const user = await getSessionUser();
    if (!user) return { error: "Sign in required." };

    const supabase = await createClient();
    const { data: event, error } = await supabase
      .from("currency_conversion_events")
      .select("*")
      .eq("user_id", user.id)
      .is("reversed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return {
        error: `${formatAuthError(error)} — run migration 20261125000007_currency_conversion.sql if missing.`,
      };
    }
    if (!event) {
      return { error: "No permanent conversion to reverse." };
    }

    const snapshot = event.snapshot as unknown as Snapshot;
    await restoreSnapshot(supabase, snapshot);

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        amount_currency: event.from_currency,
        currency: event.from_currency,
      })
      .eq("id", user.id);
    if (profileErr) throw profileErr;

    const { error: markErr } = await supabase
      .from("currency_conversion_events")
      .update({ reversed_at: new Date().toISOString() })
      .eq("id", event.id);
    if (markErr) throw markErr;

    revalidateMoneyPaths();
    return {
      success: `Restored exact original ${event.from_currency} amounts (reversed ${event.to_currency} convert).`,
    };
  } catch (error) {
    logAuthFailure("reversePermanentConvert", error);
    return { error: formatAuthError(error) };
  }
}
