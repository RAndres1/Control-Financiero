"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AccountType, MovementKind, OwnerType } from "@/lib/types";

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing field: ${key}`);
  }
  return value.trim();
}

function getNumberValue(formData: FormData, key: string) {
  const value = Number(getRequiredString(formData, key));
  if (Number.isNaN(value)) {
    throw new Error(`Invalid number: ${key}`);
  }
  return value;
}

function redirectWithMessage(path: string, type: "error" | "success", message: string) {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

function getValidOwnerType(value: string): OwnerType {
  if (value !== "personal" && value !== "business") {
    throw new Error("El tipo debe ser personal o negocio.");
  }

  return value;
}

function getValidAccountType(value: string): AccountType {
  if (!["cash", "bank", "wallet", "credit_card", "savings"].includes(value)) {
    throw new Error("El tipo de cuenta no es valido.");
  }

  return value as AccountType;
}

function getValidMovementKind(value: string): MovementKind {
  if (value !== "income" && value !== "expense") {
    throw new Error("El tipo no es valido.");
  }

  return value;
}

export async function saveAccountAction(formData: FormData) {
  try {
    const supabase = createSupabaseServerClient();
    const id = formData.get("id");
    const initialBalance = getNumberValue(formData, "initial_balance");

    if (initialBalance < 0) {
      redirectWithMessage("/accounts", "error", "El saldo inicial no puede ser menor que 0.");
    }

    const payload = {
      name: getRequiredString(formData, "name"),
      owner_type: getValidOwnerType(getRequiredString(formData, "owner_type")),
      account_type: getValidAccountType(getRequiredString(formData, "account_type")),
      currency: getRequiredString(formData, "currency").toUpperCase(),
      initial_balance: initialBalance,
      is_active: formData.get("is_active") === "on"
    };

    const query = typeof id === "string" && id
      ? supabase.from("accounts").update(payload).eq("id", id)
      : supabase.from("accounts").insert(payload);
    const { error } = await query;

    if (error) {
      redirectWithMessage("/accounts", "error", error.code === "23505" ? "Ya existe una cuenta con ese nombre." : error.message);
    }

    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/movements");
    redirectWithMessage("/accounts", "success", typeof id === "string" && id ? "Cuenta actualizada." : "Cuenta creada.");
  } catch (error) {
    if (error instanceof Error) {
      redirectWithMessage("/accounts", "error", error.message);
    }

    redirectWithMessage("/accounts", "error", "No fue posible guardar la cuenta.");
  }
}

export async function deleteAccountAction(formData: FormData) {
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("accounts").delete().eq("id", getRequiredString(formData, "id"));

    if (error) {
      redirectWithMessage(
        "/accounts",
        "error",
        error.code === "23503" ? "No puedes eliminar una cuenta con movimientos asociados." : error.message
      );
    }

    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/movements");
    redirectWithMessage("/accounts", "success", "Cuenta eliminada.");
  } catch (error) {
    if (error instanceof Error) {
      redirectWithMessage("/accounts", "error", error.message);
    }

    redirectWithMessage("/accounts", "error", "No fue posible eliminar la cuenta.");
  }
}

export async function saveCategoryAction(formData: FormData) {
  try {
    const supabase = createSupabaseServerClient();
    const id = formData.get("id");
    const name = getRequiredString(formData, "name");
    const ownerType = getValidOwnerType(getRequiredString(formData, "owner_type"));
    const kind = getValidMovementKind(getRequiredString(formData, "kind"));

    const duplicateQuery = supabase
      .from("categories")
      .select("id")
      .eq("owner_type", ownerType)
      .eq("kind", kind)
      .ilike("name", name)
      .limit(1);

    const { data: duplicateData, error: duplicateError } = await duplicateQuery;
    if (duplicateError) {
      redirectWithMessage("/categories", "error", duplicateError.message);
    }

    const duplicated = (duplicateData ?? []).some((item) => item.id !== id);
    if (duplicated) {
      redirectWithMessage("/categories", "error", "Ya existe una categoria con ese nombre para ese ambito y tipo.");
    }

    const payload = {
      name,
      owner_type: ownerType,
      kind
    };

    const query = typeof id === "string" && id
      ? supabase.from("categories").update(payload).eq("id", id)
      : supabase.from("categories").insert(payload);
    const { error } = await query;

    if (error) {
      redirectWithMessage("/categories", "error", error.message);
    }

    revalidatePath("/");
    revalidatePath("/categories");
    revalidatePath("/movements");
    redirectWithMessage("/categories", "success", typeof id === "string" && id ? "Categoria actualizada." : "Categoria creada.");
  } catch (error) {
    if (error instanceof Error) {
      redirectWithMessage("/categories", "error", error.message);
    }

    redirectWithMessage("/categories", "error", "No fue posible guardar la categoria.");
  }
}

export async function deleteCategoryAction(formData: FormData) {
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("categories").delete().eq("id", getRequiredString(formData, "id"));

    if (error) {
      redirectWithMessage(
        "/categories",
        "error",
        error.code === "23503" ? "No puedes eliminar una categoria con movimientos asociados." : error.message
      );
    }

    revalidatePath("/");
    revalidatePath("/categories");
    revalidatePath("/movements");
    redirectWithMessage("/categories", "success", "Categoria eliminada.");
  } catch (error) {
    if (error instanceof Error) {
      redirectWithMessage("/categories", "error", error.message);
    }

    redirectWithMessage("/categories", "error", "No fue posible eliminar la categoria.");
  }
}

export async function saveMovementAction(formData: FormData) {
  try {
    const supabase = createSupabaseServerClient();
    const id = formData.get("id");
    const amount = getNumberValue(formData, "amount");
    const descriptionValue = (formData.get("description") as string | null)?.trim() || "";
    const notesValue = (formData.get("notes") as string | null)?.trim() || null;

    if (amount <= 0) {
      redirectWithMessage("/movements", "error", "El monto debe ser mayor que 0.");
    }

    const payload = {
      movement_date: getRequiredString(formData, "movement_date"),
      description: descriptionValue || notesValue || "Movimiento sin descripcion",
      amount,
      kind: getValidMovementKind(getRequiredString(formData, "kind")),
      owner_type: getValidOwnerType(getRequiredString(formData, "owner_type")),
      account_id: getRequiredString(formData, "account_id"),
      category_id: getRequiredString(formData, "category_id"),
      notes: notesValue
    };

    const [{ data: accountData, error: accountError }, { data: categoryData, error: categoryError }] = await Promise.all([
      supabase.from("accounts").select("id, owner_type").eq("id", payload.account_id).maybeSingle(),
      supabase.from("categories").select("id, owner_type, kind").eq("id", payload.category_id).maybeSingle()
    ]);

    if (accountError || categoryError) {
      redirectWithMessage("/movements", "error", accountError?.message || categoryError?.message || "No fue posible validar el movimiento.");
    }

    if (!accountData) {
      redirectWithMessage("/movements", "error", "La cuenta seleccionada no existe.");
    }

    if (!categoryData) {
      redirectWithMessage("/movements", "error", "La categoria seleccionada no existe.");
    }

    const account = accountData!;
    const category = categoryData!;

    if (account.owner_type !== payload.owner_type) {
      redirectWithMessage("/movements", "error", "La cuenta no coincide con el ambito del movimiento.");
    }

    if (category.owner_type !== payload.owner_type || category.kind !== payload.kind) {
      redirectWithMessage("/movements", "error", "La categoria no coincide con el ambito y tipo del movimiento.");
    }

    const query = typeof id === "string" && id
      ? supabase.from("movements").update(payload).eq("id", id)
      : supabase.from("movements").insert(payload);
    const { error } = await query;

    if (error) {
      redirectWithMessage("/movements", "error", error.message);
    }

    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/movements");
    redirectWithMessage("/movements", "success", typeof id === "string" && id ? "Movimiento actualizado." : "Movimiento creado.");
  } catch (error) {
    if (error instanceof Error) {
      redirectWithMessage("/movements", "error", error.message);
    }

    redirectWithMessage("/movements", "error", "No fue posible guardar el movimiento.");
  }
}

export async function deleteMovementAction(formData: FormData) {
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("movements").delete().eq("id", getRequiredString(formData, "id"));

    if (error) {
      redirectWithMessage("/movements", "error", error.message);
    }

    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/movements");
    redirectWithMessage("/movements", "success", "Movimiento eliminado.");
  } catch (error) {
    if (error instanceof Error) {
      redirectWithMessage("/movements", "error", error.message);
    }

    redirectWithMessage("/movements", "error", "No fue posible eliminar el movimiento.");
  }
}
