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

function missingConfig(): ActionState {
  return { error: "Supabase is not configured. Check .env.local and restart the app." };
}

async function requireUser() {
  if (!isSupabaseConfigured()) return { error: missingConfig().error } as const;
  const user = await getSessionUser();
  if (!user) return { error: "Sign in required." } as const;
  return { user } as const;
}

async function parseExpenseFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const amount = await displayInputToStored(toNumber(formData.get("amount")));
  const categoryId = String(formData.get("category_id") ?? "").trim() || null;
  const expenseDate = String(formData.get("expense_date") ?? "").trim();
  const paymentMethod = String(formData.get("payment_method") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  return { name, amount, categoryId, expenseDate, paymentMethod, notes };
}

export async function createExpense(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const fields = await parseExpenseFields(formData);
  if (!fields.name) return { error: "Expense name is required." };
  if (fields.amount <= 0) return { error: "Amount must be greater than zero." };
  if (!fields.expenseDate) return { error: "Date is required." };

  try {
    const supabase = await createClient();

    // Duplicate prevention: same name + amount + date (+ category) already exists
    let dupQuery = supabase
      .from("expenses")
      .select("id")
      .eq("user_id", auth.user.id)
      .ilike("name", fields.name)
      .eq("amount", fields.amount)
      .eq("expense_date", fields.expenseDate)
      .limit(1);
    if (fields.categoryId) {
      dupQuery = dupQuery.eq("category_id", fields.categoryId);
    } else {
      dupQuery = dupQuery.is("category_id", null);
    }
    const { data: dup } = await dupQuery.maybeSingle();
    if (dup) {
      return {
        error:
          "A matching expense already exists (same name, amount, date, and category). Edit the existing one instead.",
      };
    }

    const { error } = await supabase.from("expenses").insert({
      user_id: auth.user.id,
      name: fields.name,
      amount: fields.amount,
      category_id: fields.categoryId,
      expense_date: fields.expenseDate,
      payment_method: fields.paymentMethod,
      notes: fields.notes,
      source: "manual",
    });
    if (error) {
      logAuthFailure("createExpense", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("createExpense", error);
    return { error: formatAuthError(error) };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/budget");
  return { success: "Expense saved." };
}

export async function updateExpense(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  const fields = await parseExpenseFields(formData);
  if (!id) return { error: "Expense id is required." };
  if (!fields.name) return { error: "Expense name is required." };
  if (fields.amount <= 0) return { error: "Amount must be greater than zero." };
  if (!fields.expenseDate) return { error: "Date is required." };

  try {
    const supabase = await createClient();

    let dupQuery = supabase
      .from("expenses")
      .select("id")
      .eq("user_id", auth.user.id)
      .ilike("name", fields.name)
      .eq("amount", fields.amount)
      .eq("expense_date", fields.expenseDate)
      .neq("id", id)
      .limit(1);
    if (fields.categoryId) {
      dupQuery = dupQuery.eq("category_id", fields.categoryId);
    } else {
      dupQuery = dupQuery.is("category_id", null);
    }
    const { data: dup } = await dupQuery.maybeSingle();
    if (dup) {
      return {
        error:
          "Another expense already matches this name, amount, date, and category.",
      };
    }

    const { error } = await supabase
      .from("expenses")
      .update({
        name: fields.name,
        amount: fields.amount,
        category_id: fields.categoryId,
        expense_date: fields.expenseDate,
        payment_method: fields.paymentMethod,
        notes: fields.notes,
      })
      .eq("id", id)
      .eq("user_id", auth.user.id);
    if (error) {
      logAuthFailure("updateExpense", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("updateExpense", error);
    return { error: formatAuthError(error) };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/budget");
  return { success: "Expense updated." };
}

export async function deleteExpense(formData: FormData): Promise<void> {
  const auth = await requireUser();
  if ("error" in auth) return;
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  try {
    const supabase = await createClient();
    await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);
  } catch (error) {
    logAuthFailure("deleteExpense", error);
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/budget");
}
