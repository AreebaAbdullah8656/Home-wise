"use server";

import { revalidatePath } from "next/cache";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { toNumber, todayIso } from "@/lib/budget-math";
import { displayInputToStored } from "@/lib/currency/input";
import { formatAuthError, logAuthFailure } from "@/lib/supabase/errors";
import { billExtractionSchema } from "@/lib/gemini/schemas";

export type ActionState = {
  error?: string;
  success?: string;
  billId?: string;
};

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

function revalidateBillPaths() {
  revalidatePath("/bills");
  revalidatePath("/scan-bill");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/budget");
  revalidatePath("/reports");
}

async function resolveCategoryId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  suggestion: string | null | undefined,
  categories: { id: string; name: string }[]
) {
  if (!suggestion?.trim()) return null;
  const needle = suggestion.trim().toLowerCase();
  const exact = categories.find((c) => c.name.toLowerCase() === needle);
  if (exact) return exact.id;
  const partial = categories.find(
    (c) =>
      c.name.toLowerCase().includes(needle) ||
      needle.includes(c.name.toLowerCase())
  );
  return partial?.id ?? null;
}

/**
 * Confirm reviewed OCR: upload original → bill + items → expenses (once).
 * Never call this with unreviewed data.
 */
export async function confirmBillScan(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const extractionRaw = String(formData.get("extraction_json") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size <= 0) {
    return { error: "Original bill file is required to confirm and store." };
  }

  let extraction;
  try {
    extraction = billExtractionSchema.parse(JSON.parse(extractionRaw));
  } catch {
    return {
      error:
        "Reviewed bill data is invalid. Re-scan or fix the fields and try again.",
    };
  }

  const storeName =
    String(formData.get("store_name") ?? extraction.store_name ?? "").trim() ||
    null;
  const purchaseDate =
    String(formData.get("purchase_date") ?? "").trim() ||
    extraction.purchase_date ||
    todayIso();
  const totalAmount = await displayInputToStored(
    toNumber(formData.get("total_amount") ?? extraction.total_amount ?? 0)
  );
  const notes =
    String(formData.get("notes") ?? extraction.notes ?? "").trim() || null;

  const itemsJson = String(formData.get("items_json") ?? "");
  let items = extraction.items;
  if (itemsJson) {
    try {
      items = billExtractionSchema.shape.items.parse(JSON.parse(itemsJson));
    } catch {
      return { error: "Could not read corrected line items." };
    }
  }

  if (!items.length && totalAmount <= 0) {
    return { error: "Add at least one item or a total amount before confirming." };
  }

  try {
    const supabase = await createClient();
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", auth.user.id);

    const cats = categories ?? [];
    const billId = crypto.randomUUID();
    const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "bill";
    const storagePath = `${auth.user.id}/${billId}/${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("bills")
      .upload(storagePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (uploadError) {
      logAuthFailure("confirmBillScan.upload", uploadError);
      return { error: formatAuthError(uploadError) };
    }

    const { error: billError } = await supabase.from("bills").insert({
      id: billId,
      user_id: auth.user.id,
      store_name: storeName,
      purchase_date: purchaseDate,
      total_amount: totalAmount > 0 ? totalAmount : null,
      storage_path: storagePath,
      mime_type: file.type || null,
      status: "confirmed",
      notes,
    });
    if (billError) {
      await supabase.storage.from("bills").remove([storagePath]);
      logAuthFailure("confirmBillScan.bill", billError);
      return { error: formatAuthError(billError) };
    }

    const itemRows = [];
    for (const item of items) {
      const rawUnit = item.unit_price ?? null;
      const rawLine =
        item.line_total ??
        (item.unit_price != null && item.quantity != null
          ? toNumber(item.unit_price) * toNumber(item.quantity)
          : item.unit_price ?? null);
      itemRows.push({
        bill_id: billId,
        user_id: auth.user.id,
        product_name: item.product_name,
        quantity: item.quantity ?? 1,
        unit_price:
          rawUnit == null ? null : await displayInputToStored(toNumber(rawUnit)),
        line_total:
          rawLine == null ? null : await displayInputToStored(toNumber(rawLine)),
        category_suggestion: item.category_suggestion ?? null,
        category_id: null as string | null,
        is_confirmed: true,
      });
    }

    for (const row of itemRows) {
      row.category_id = await resolveCategoryId(
        supabase,
        auth.user.id,
        row.category_suggestion,
        cats
      );
    }

    if (itemRows.length) {
      const { error: itemsError } = await supabase
        .from("bill_items")
        .insert(itemRows);
      if (itemsError) {
        logAuthFailure("confirmBillScan.items", itemsError);
        return { error: formatAuthError(itemsError) };
      }
    }

    // Create expenses from confirmed items (or one total expense if no lines)
    const expenseSources =
      itemRows.length > 0
        ? itemRows.map((row) => ({
            name: row.product_name,
            amount: toNumber(
              row.line_total ??
                (row.unit_price != null
                  ? toNumber(row.unit_price) * toNumber(row.quantity ?? 1)
                  : 0)
            ),
            category_id: row.category_id,
          }))
        : [
            {
              name: storeName ? `${storeName} bill` : "Bill total",
              amount: totalAmount,
              category_id: null as string | null,
            },
          ];

    for (const exp of expenseSources) {
      if (exp.amount <= 0) continue;

      let dupQuery = supabase
        .from("expenses")
        .select("id")
        .eq("user_id", auth.user.id)
        .ilike("name", exp.name)
        .eq("amount", exp.amount)
        .eq("expense_date", purchaseDate)
        .limit(1);
      if (exp.category_id) {
        dupQuery = dupQuery.eq("category_id", exp.category_id);
      } else {
        dupQuery = dupQuery.is("category_id", null);
      }
      const { data: dup } = await dupQuery.maybeSingle();
      if (dup) continue;

      // Also skip if already linked to this bill with same name/amount
      const { data: linked } = await supabase
        .from("expenses")
        .select("id")
        .eq("user_id", auth.user.id)
        .eq("bill_id", billId)
        .ilike("name", exp.name)
        .eq("amount", exp.amount)
        .limit(1)
        .maybeSingle();
      if (linked) continue;

      const { error: expError } = await supabase.from("expenses").insert({
        user_id: auth.user.id,
        name: exp.name,
        amount: exp.amount,
        expense_date: purchaseDate,
        category_id: exp.category_id,
        notes: storeName ? `From bill: ${storeName}` : "From scanned bill",
        source: "bill",
        bill_id: billId,
      });
      if (expError) {
        logAuthFailure("confirmBillScan.expense", expError);
        return { error: formatAuthError(expError) };
      }
    }

    revalidateBillPaths();
    return {
      success: "Bill confirmed. Items saved and expenses created without duplicates.",
      billId,
    };
  } catch (error) {
    logAuthFailure("confirmBillScan", error);
    return { error: formatAuthError(error) };
  }
}

export async function deleteBill(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing bill id." };

  try {
    const supabase = await createClient();
    const { data: bill, error: fetchError } = await supabase
      .from("bills")
      .select("id, storage_path")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (fetchError) {
      logAuthFailure("deleteBill.fetch", fetchError);
      return { error: formatAuthError(fetchError) };
    }
    if (!bill) return { error: "Bill not found." };

    if (bill.storage_path) {
      const { error: storageError } = await supabase.storage
        .from("bills")
        .remove([bill.storage_path]);
      if (storageError) {
        logAuthFailure("deleteBill.storage", storageError);
        // Continue to delete DB row so user is not stuck
      }
    }

    // Expenses keep history but unlink; or delete bill-sourced expenses?
    // SPEC: delete bills — unlink expenses (bill_id on delete set null via FK).
    const { error: deleteError } = await supabase
      .from("bills")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);
    if (deleteError) {
      logAuthFailure("deleteBill", deleteError);
      return { error: formatAuthError(deleteError) };
    }
  } catch (error) {
    logAuthFailure("deleteBill", error);
    return { error: formatAuthError(error) };
  }

  revalidateBillPaths();
  return { success: "Bill deleted (and storage file removed when possible)." };
}

export async function getBillDownloadUrl(
  billId: string
): Promise<{ url?: string; error?: string }> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  try {
    const supabase = await createClient();
    const { data: bill, error } = await supabase
      .from("bills")
      .select("storage_path")
      .eq("id", billId)
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (error) return { error: formatAuthError(error) };
    if (!bill?.storage_path) return { error: "No stored file for this bill." };

    const { data, error: signError } = await supabase.storage
      .from("bills")
      .createSignedUrl(bill.storage_path, 120);
    if (signError) return { error: formatAuthError(signError) };
    return { url: data.signedUrl };
  } catch (error) {
    return { error: formatAuthError(error) };
  }
}
