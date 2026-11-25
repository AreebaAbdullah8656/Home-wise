"use server";

import { revalidatePath } from "next/cache";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { monthStartIso, toNumber } from "@/lib/budget-math";
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

export async function upsertMonthlyBudget(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const yearMonth =
    String(formData.get("year_month") ?? "").trim() || monthStartIso();
  const totalAmount = await displayInputToStored(
    toNumber(formData.get("total_amount"))
  );
  const savingsAllocation = await displayInputToStored(
    toNumber(formData.get("savings_allocation"))
  );
  const emergencyAllocation = await displayInputToStored(
    toNumber(formData.get("emergency_allocation"))
  );
  const notes = String(formData.get("notes") ?? "").trim();

  if (totalAmount < 0 || savingsAllocation < 0 || emergencyAllocation < 0) {
    return { error: "Amounts cannot be negative." };
  }
  if (savingsAllocation + emergencyAllocation > totalAmount) {
    return {
      error:
        "Savings + emergency allocations cannot exceed the total monthly budget. Allocations are set-asides, not expenses.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("monthly_budgets").upsert(
      {
        user_id: auth.user.id,
        year_month: yearMonth,
        total_amount: totalAmount,
        savings_allocation: savingsAllocation,
        emergency_allocation: emergencyAllocation,
        notes: notes || null,
      },
      { onConflict: "user_id,year_month" }
    );
    if (error) {
      logAuthFailure("upsertMonthlyBudget", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("upsertMonthlyBudget", error);
    return { error: formatAuthError(error) };
  }

  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return { success: "Monthly budget saved." };
}

export async function createCategory(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const name = String(formData.get("name") ?? "").trim();
  const spendingLimitRaw = String(formData.get("spending_limit") ?? "").trim();
  const spendingLimit =
    spendingLimitRaw === ""
      ? null
      : await displayInputToStored(toNumber(spendingLimitRaw));

  if (!name) return { error: "Category name is required." };

  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true })
      .eq("user_id", auth.user.id);

    const { error } = await supabase.from("categories").insert({
      user_id: auth.user.id,
      name,
      is_default: false,
      spending_limit: spendingLimit,
      sort_order: (count ?? 0) + 1,
    });
    if (error) {
      if (error.code === "23505") {
        return { error: "A category with that name already exists." };
      }
      logAuthFailure("createCategory", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("createCategory", error);
    return { error: formatAuthError(error) };
  }

  revalidatePath("/budget");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: "Category added." };
}

export async function updateCategory(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const spendingLimitRaw = String(formData.get("spending_limit") ?? "").trim();
  const spendingLimit =
    spendingLimitRaw === ""
      ? null
      : await displayInputToStored(toNumber(spendingLimitRaw));

  if (!id || !name) return { error: "Category id and name are required." };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("categories")
      .update({
        name,
        spending_limit: spendingLimit,
      })
      .eq("id", id)
      .eq("user_id", auth.user.id);
    if (error) {
      if (error.code === "23505") {
        return { error: "A category with that name already exists." };
      }
      logAuthFailure("updateCategory", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("updateCategory", error);
    return { error: formatAuthError(error) };
  }

  revalidatePath("/budget");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: "Category updated." };
}

export async function deleteCategory(formData: FormData): Promise<void> {
  const auth = await requireUser();
  if ("error" in auth) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  try {
    const supabase = await createClient();
    // Soft-protect defaults: allow delete but keep expenses via ON DELETE SET NULL
    await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);
  } catch (error) {
    logAuthFailure("deleteCategory", error);
  }

  revalidatePath("/budget");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}
