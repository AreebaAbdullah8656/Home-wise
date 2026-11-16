"use server";

import { revalidatePath } from "next/cache";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { toNumber, todayIso } from "@/lib/budget-math";
import { formatAuthError, logAuthFailure } from "@/lib/supabase/errors";

export type ActionState = {
  error?: string;
  success?: string;
};

const PRIORITIES = new Set(["low", "normal", "high"]);

function missingConfig(): ActionState {
  return {
    error: "Supabase is not configured. Check .env.local and restart the app.",
  };
}

async function requireUser() {
  if (!isSupabaseConfigured()) return { error: missingConfig().error } as const;
  const user = await getSessionUser();
  if (!user) return { error: "Sign in required." } as const;
  return { user } as const;
}

function parseItemFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const quantity = String(formData.get("quantity") ?? "").trim() || null;
  const estimatedPriceRaw = String(formData.get("estimated_price") ?? "").trim();
  const actualPriceRaw = String(formData.get("actual_price") ?? "").trim();
  const priority = String(formData.get("priority") ?? "normal").trim();
  const estimated_price =
    estimatedPriceRaw === "" ? null : toNumber(estimatedPriceRaw);
  const actual_price = actualPriceRaw === "" ? null : toNumber(actualPriceRaw);
  return {
    name,
    quantity,
    estimated_price,
    actual_price,
    priority: PRIORITIES.has(priority) ? priority : "normal",
  };
}

async function findGroceriesCategoryId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", "Groceries")
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export async function createGroceryItem(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const fields = parseItemFields(formData);
  if (!fields.name) return { error: "Item name is required." };
  if (fields.estimated_price !== null && fields.estimated_price < 0) {
    return { error: "Estimated price cannot be negative." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("grocery_items").insert({
      user_id: auth.user.id,
      name: fields.name,
      quantity: fields.quantity,
      estimated_price: fields.estimated_price,
      actual_price: fields.actual_price,
      priority: fields.priority,
      is_purchased: false,
    });
    if (error) {
      logAuthFailure("createGroceryItem", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("createGroceryItem", error);
    return { error: formatAuthError(error) };
  }

  revalidatePath("/grocery");
  return { success: "Item added." };
}

export async function updateGroceryItem(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing item id." };

  const fields = parseItemFields(formData);
  if (!fields.name) return { error: "Item name is required." };
  if (fields.estimated_price !== null && fields.estimated_price < 0) {
    return { error: "Estimated price cannot be negative." };
  }
  if (fields.actual_price !== null && fields.actual_price < 0) {
    return { error: "Actual price cannot be negative." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("grocery_items")
      .update({
        name: fields.name,
        quantity: fields.quantity,
        estimated_price: fields.estimated_price,
        actual_price: fields.actual_price,
        priority: fields.priority,
      })
      .eq("id", id)
      .eq("user_id", auth.user.id);
    if (error) {
      logAuthFailure("updateGroceryItem", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("updateGroceryItem", error);
    return { error: formatAuthError(error) };
  }

  revalidatePath("/grocery");
  return { success: "Item updated." };
}

export async function deleteGroceryItem(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing item id." };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("grocery_items")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);
    if (error) {
      logAuthFailure("deleteGroceryItem", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("deleteGroceryItem", error);
    return { error: formatAuthError(error) };
  }

  revalidatePath("/grocery");
  return { success: "Item deleted." };
}

/**
 * Mark purchased and optionally create a linked expense once.
 * Never creates a second expense when expense_id is already set.
 */
export async function markGroceryPurchased(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing item id." };

  const actualRaw = String(formData.get("actual_price") ?? "").trim();
  const createExpense =
    String(formData.get("create_expense") ?? "on") === "on";

  try {
    const supabase = await createClient();
    const { data: item, error: fetchError } = await supabase
      .from("grocery_items")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (fetchError) {
      logAuthFailure("markGroceryPurchased.fetch", fetchError);
      return { error: formatAuthError(fetchError) };
    }
    if (!item) return { error: "Item not found." };

    const actual_price =
      actualRaw === ""
        ? item.actual_price === null
          ? null
          : toNumber(item.actual_price)
        : toNumber(actualRaw);

    let expenseId = item.expense_id;
    let expenseNote: string | undefined;

    if (createExpense && !expenseId) {
      const amount =
        actual_price !== null && actual_price > 0
          ? actual_price
          : toNumber(item.estimated_price);

      if (amount <= 0) {
        return {
          error:
            "Enter an actual or estimated price before recording as an expense.",
        };
      }

      // Duplicate guard: same grocery already linked, or matching expense row
      if (item.expense_id) {
        expenseId = item.expense_id;
      } else {
        const categoryId = await findGroceriesCategoryId(
          supabase,
          auth.user.id
        );
        const expenseDate = todayIso();
        const expenseName = item.name;

        let dupQuery = supabase
          .from("expenses")
          .select("id")
          .eq("user_id", auth.user.id)
          .ilike("name", expenseName)
          .eq("amount", amount)
          .eq("expense_date", expenseDate)
          .limit(1);
        if (categoryId) {
          dupQuery = dupQuery.eq("category_id", categoryId);
        } else {
          dupQuery = dupQuery.is("category_id", null);
        }
        const { data: existing } = await dupQuery.maybeSingle();

        if (existing) {
          expenseId = existing.id;
          expenseNote =
            "Linked to an existing matching expense (duplicate avoided).";
        } else {
          const { data: created, error: insertError } = await supabase
            .from("expenses")
            .insert({
              user_id: auth.user.id,
              name: expenseName,
              amount,
              expense_date: expenseDate,
              category_id: categoryId,
              payment_method: null,
              notes: item.quantity
                ? `From grocery list (qty: ${item.quantity})`
                : "From grocery list",
              source: "grocery",
            })
            .select("id")
            .single();
          if (insertError) {
            logAuthFailure("markGroceryPurchased.expense", insertError);
            return { error: formatAuthError(insertError) };
          }
          expenseId = created.id;
          expenseNote = "Expense recorded.";
        }
      }
    } else if (expenseId) {
      expenseNote = "Already linked to an expense — no duplicate created.";
    }

    const { error: updateError } = await supabase
      .from("grocery_items")
      .update({
        is_purchased: true,
        actual_price:
          actual_price !== null ? actual_price : item.actual_price,
        expense_id: expenseId,
      })
      .eq("id", id)
      .eq("user_id", auth.user.id);
    if (updateError) {
      logAuthFailure("markGroceryPurchased.update", updateError);
      return { error: formatAuthError(updateError) };
    }

    revalidatePath("/grocery");
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    revalidatePath("/budget");
    revalidatePath("/reports");

    return {
      success: expenseNote
        ? `Marked purchased. ${expenseNote}`
        : "Marked purchased (no expense created).",
    };
  } catch (error) {
    logAuthFailure("markGroceryPurchased", error);
    return { error: formatAuthError(error) };
  }
}

export async function unmarkGroceryPurchased(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing item id." };

  try {
    const supabase = await createClient();
    // Keep expense_id so remaking purchased cannot create a second expense
    const { error } = await supabase
      .from("grocery_items")
      .update({ is_purchased: false })
      .eq("id", id)
      .eq("user_id", auth.user.id);
    if (error) {
      logAuthFailure("unmarkGroceryPurchased", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("unmarkGroceryPurchased", error);
    return { error: formatAuthError(error) };
  }

  revalidatePath("/grocery");
  return {
    success:
      "Moved back to pending. Linked expense (if any) was kept to avoid duplicates.",
  };
}
