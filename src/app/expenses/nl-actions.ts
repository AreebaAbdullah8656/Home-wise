"use server";

import { revalidatePath } from "next/cache";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { toNumber } from "@/lib/budget-math";
import { displayInputToStored } from "@/lib/currency/input";
import { formatAuthError, logAuthFailure } from "@/lib/supabase/errors";

export type ActionState = {
  error?: string;
  success?: string;
};

async function requireUser() {
  if (!isSupabaseConfigured()) {
    return {
      error: "Supabase is not configured. Check .env.local and restart the app.",
    } as const;
  }
  const user = await getSessionUser();
  if (!user) return { error: "Sign in required." } as const;
  return { user } as const;
}

/** Save only after the user reviewed the NL suggestion. */
export async function confirmNlExpense(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const name = String(formData.get("name") ?? "").trim();
  const amount = await displayInputToStored(toNumber(formData.get("amount")));
  const categoryId = String(formData.get("category_id") ?? "").trim() || null;
  const expenseDate = String(formData.get("expense_date") ?? "").trim();
  const paymentMethod =
    String(formData.get("payment_method") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) return { error: "Expense name is required." };
  if (amount <= 0) return { error: "Amount must be greater than zero." };
  if (!expenseDate) return { error: "Date is required." };

  try {
    const supabase = await createClient();

    let dupQuery = supabase
      .from("expenses")
      .select("id")
      .eq("user_id", auth.user.id)
      .ilike("name", name)
      .eq("amount", amount)
      .eq("expense_date", expenseDate)
      .limit(1);
    if (categoryId) dupQuery = dupQuery.eq("category_id", categoryId);
    else dupQuery = dupQuery.is("category_id", null);
    const { data: dup } = await dupQuery.maybeSingle();
    if (dup) {
      return {
        error:
          "A matching expense already exists (same name, amount, date, and category).",
      };
    }

    const { error } = await supabase.from("expenses").insert({
      user_id: auth.user.id,
      name,
      amount,
      category_id: categoryId,
      expense_date: expenseDate,
      payment_method: paymentMethod,
      notes,
      source: "natural_language",
    });
    if (error) {
      logAuthFailure("confirmNlExpense", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("confirmNlExpense", error);
    return { error: formatAuthError(error) };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/budget");
  revalidatePath("/reports");
  return { success: "Natural-language expense saved after your confirmation." };
}
