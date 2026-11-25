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

async function parseFundFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const target_amount = await displayInputToStored(
    toNumber(formData.get("target_amount"))
  );
  const allocated_amount = await displayInputToStored(
    toNumber(formData.get("allocated_amount"))
  );
  const actual_amount = await displayInputToStored(
    toNumber(formData.get("actual_amount"))
  );
  const notes = String(formData.get("notes") ?? "").trim() || null;
  return { name, target_amount, allocated_amount, actual_amount, notes };
}

function validateFundFields(
  fields: Awaited<ReturnType<typeof parseFundFields>>
) {
  if (!fields.name) return "Name is required.";
  if (
    fields.target_amount < 0 ||
    fields.allocated_amount < 0 ||
    fields.actual_amount < 0
  ) {
    return "Amounts cannot be negative.";
  }
  return null;
}

function revalidateSavings() {
  revalidatePath("/savings");
  revalidatePath("/dashboard");
  revalidatePath("/budget");
  revalidatePath("/reports");
}

export async function createSavingsGoal(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const fields = await parseFundFields(formData);
  const invalid = validateFundFields(fields);
  if (invalid) return { error: invalid };

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("savings_goals").insert({
      user_id: auth.user.id,
      ...fields,
    });
    if (error) {
      logAuthFailure("createSavingsGoal", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("createSavingsGoal", error);
    return { error: formatAuthError(error) };
  }

  revalidateSavings();
  return {
    success:
      "Savings goal saved. Allocated and actual amounts are set-asides — not expenses.",
  };
}

export async function updateSavingsGoal(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing goal id." };

  const fields = await parseFundFields(formData);
  const invalid = validateFundFields(fields);
  if (invalid) return { error: invalid };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("savings_goals")
      .update(fields)
      .eq("id", id)
      .eq("user_id", auth.user.id);
    if (error) {
      logAuthFailure("updateSavingsGoal", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("updateSavingsGoal", error);
    return { error: formatAuthError(error) };
  }

  revalidateSavings();
  return { success: "Savings goal updated." };
}

export async function deleteSavingsGoal(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing goal id." };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("savings_goals")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);
    if (error) {
      logAuthFailure("deleteSavingsGoal", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("deleteSavingsGoal", error);
    return { error: formatAuthError(error) };
  }

  revalidateSavings();
  return { success: "Savings goal deleted." };
}

export async function createEmergencyFund(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const fields = await parseFundFields(formData);
  if (!fields.name) fields.name = "Emergency fund";
  const invalid = validateFundFields(fields);
  if (invalid) return { error: invalid };

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("emergency_funds").insert({
      user_id: auth.user.id,
      ...fields,
    });
    if (error) {
      logAuthFailure("createEmergencyFund", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("createEmergencyFund", error);
    return { error: formatAuthError(error) };
  }

  revalidateSavings();
  return {
    success:
      "Emergency fund saved. Allocated vs actual are tracked separately from expenses.",
  };
}

export async function updateEmergencyFund(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing fund id." };

  const fields = await parseFundFields(formData);
  if (!fields.name) fields.name = "Emergency fund";
  const invalid = validateFundFields(fields);
  if (invalid) return { error: invalid };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("emergency_funds")
      .update(fields)
      .eq("id", id)
      .eq("user_id", auth.user.id);
    if (error) {
      logAuthFailure("updateEmergencyFund", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("updateEmergencyFund", error);
    return { error: formatAuthError(error) };
  }

  revalidateSavings();
  return { success: "Emergency fund updated." };
}

export async function deleteEmergencyFund(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing fund id." };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("emergency_funds")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);
    if (error) {
      logAuthFailure("deleteEmergencyFund", error);
      return { error: formatAuthError(error) };
    }
  } catch (error) {
    logAuthFailure("deleteEmergencyFund", error);
    return { error: formatAuthError(error) };
  }

  revalidateSavings();
  return { success: "Emergency fund deleted." };
}
