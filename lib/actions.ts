"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AccountType, FinancialProduct, MovementKind } from "@/lib/types";
import { withScope } from "@/lib/utils";

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing field: ${key}`);
  }
  return value.trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function getNumberValue(formData: FormData, key: string) {
  const value = Number(getRequiredString(formData, key));
  if (Number.isNaN(value)) {
    throw new Error(`Invalid number: ${key}`);
  }
  return value;
}

function getOptionalNumberValue(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`Invalid number: ${key}`);
  }

  return parsed;
}

function getScopeValue(formData: FormData) {
  return getOptionalString(formData, "scope") ?? "personal";
}

function redirectWithMessage(path: string, scope: string, type: "error" | "success", message: string, extraParams?: Record<string, string | undefined>) {
  redirect(withScope(path, scope, { ...extraParams, [type]: message }));
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

function getValidFinancialProducts(formData: FormData): FinancialProduct[] {
  const values = formData.getAll("financial_products");
  const validProducts: FinancialProduct[] = ["bank_account", "credit_card", "loan"];

  return values.filter((value): value is FinancialProduct => typeof value === "string" && validProducts.includes(value as FinancialProduct));
}

export async function saveAccountAction(formData: FormData) {
  const scope = getScopeValue(formData);

  try {
    const supabase = await createSupabaseServerClient();
    const id = formData.get("id");
    const initialBalance = getNumberValue(formData, "initial_balance");

    if (initialBalance < 0) {
      redirectWithMessage("/accounts", scope, "error", "El saldo inicial no puede ser menor que 0.");
    }

    const payload = {
      workspace_id: getRequiredString(formData, "workspace_id"),
      name: getRequiredString(formData, "name"),
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
      redirectWithMessage("/accounts", scope, "error", error.code === "23505" ? "Ya existe una cuenta con ese nombre en ese workspace." : error.message);
    }

    revalidatePath("/");
    revalidatePath("/reports");
    revalidatePath("/accounts");
    revalidatePath("/movements");
    redirectWithMessage("/accounts", scope, "success", typeof id === "string" && id ? "Cuenta actualizada." : "Cuenta creada.");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof Error) {
      redirectWithMessage("/accounts", scope, "error", error.message);
    }

    redirectWithMessage("/accounts", scope, "error", "No fue posible guardar la cuenta.");
  }
}

export async function deleteAccountAction(formData: FormData) {
  const scope = getScopeValue(formData);

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("accounts").delete().eq("id", getRequiredString(formData, "id"));

    if (error) {
      redirectWithMessage(
        "/accounts",
        scope,
        "error",
        error.code === "23503" ? "No puedes eliminar una cuenta con movimientos asociados." : error.message
      );
    }

    revalidatePath("/");
    revalidatePath("/reports");
    revalidatePath("/accounts");
    revalidatePath("/movements");
    redirectWithMessage("/accounts", scope, "success", "Cuenta eliminada.");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof Error) {
      redirectWithMessage("/accounts", scope, "error", error.message);
    }

    redirectWithMessage("/accounts", scope, "error", "No fue posible eliminar la cuenta.");
  }
}

export async function saveCategoryAction(formData: FormData) {
  const scope = getScopeValue(formData);

  try {
    const supabase = await createSupabaseServerClient();
    const id = formData.get("id");
    const name = getRequiredString(formData, "name");
    const workspaceId = getRequiredString(formData, "workspace_id");
    const kind = getValidMovementKind(getRequiredString(formData, "kind"));

    const { data: duplicateData, error: duplicateError } = await supabase
      .from("categories")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("kind", kind)
      .ilike("name", name)
      .limit(1);

    if (duplicateError) {
      redirectWithMessage("/categories", scope, "error", duplicateError.message);
    }

    const duplicated = (duplicateData ?? []).some((item) => item.id !== id);
    if (duplicated) {
      redirectWithMessage("/categories", scope, "error", "Ya existe una categoria con ese nombre y tipo en ese workspace.");
    }

    const payload = {
      workspace_id: workspaceId,
      name,
      kind
    };

    const query = typeof id === "string" && id
      ? supabase.from("categories").update(payload).eq("id", id)
      : supabase.from("categories").insert(payload);
    const { error } = await query;

    if (error) {
      redirectWithMessage("/categories", scope, "error", error.message);
    }

    revalidatePath("/");
    revalidatePath("/reports");
    revalidatePath("/categories");
    revalidatePath("/movements");
    redirectWithMessage("/categories", scope, "success", typeof id === "string" && id ? "Categoria actualizada." : "Categoria creada.");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof Error) {
      redirectWithMessage("/categories", scope, "error", error.message);
    }

    redirectWithMessage("/categories", scope, "error", "No fue posible guardar la categoria.");
  }
}

export async function deleteCategoryAction(formData: FormData) {
  const scope = getScopeValue(formData);

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("categories").delete().eq("id", getRequiredString(formData, "id"));

    if (error) {
      redirectWithMessage(
        "/categories",
        scope,
        "error",
        error.code === "23503" ? "No puedes eliminar una categoria con movimientos asociados." : error.message
      );
    }

    revalidatePath("/");
    revalidatePath("/reports");
    revalidatePath("/categories");
    revalidatePath("/movements");
    redirectWithMessage("/categories", scope, "success", "Categoria eliminada.");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof Error) {
      redirectWithMessage("/categories", scope, "error", error.message);
    }

    redirectWithMessage("/categories", scope, "error", "No fue posible eliminar la categoria.");
  }
}

export async function saveMovementAction(formData: FormData) {
  const scope = getScopeValue(formData);

  try {
    const supabase = await createSupabaseServerClient();
    const id = formData.get("id");
    const amount = getNumberValue(formData, "amount");
    const descriptionValue = getOptionalString(formData, "description") ?? "";
    const notesValue = (formData.get("notes") as string | null)?.trim() || null;
    const movementKind = getValidMovementKind(getRequiredString(formData, "kind"));
    const workspaceId = getRequiredString(formData, "workspace_id");
    const accountId = getRequiredString(formData, "account_id");
    const categoryId = getRequiredString(formData, "category_id");

    if (amount <= 0) {
      redirectWithMessage("/movements", scope, "error", "El monto debe ser mayor que 0.");
    }

    const [{ data: accountData, error: accountError }, { data: categoryData, error: categoryError }] = await Promise.all([
      supabase.from("accounts").select("id, workspace_id, name").eq("id", accountId).maybeSingle(),
      supabase.from("categories").select("id, workspace_id, kind, name").eq("id", categoryId).maybeSingle()
    ]);

    if (accountError || categoryError) {
      redirectWithMessage("/movements", scope, "error", accountError?.message || categoryError?.message || "No fue posible validar el movimiento.");
    }

    if (!accountData) {
      redirectWithMessage("/movements", scope, "error", "La cuenta seleccionada no existe.");
    }

    if (!categoryData) {
      redirectWithMessage("/movements", scope, "error", "La categoria seleccionada no existe.");
    }

    if (accountData!.workspace_id !== workspaceId) {
      redirectWithMessage("/movements", scope, "error", "La cuenta no pertenece al workspace del movimiento.");
    }

    if (categoryData!.workspace_id !== workspaceId || categoryData!.kind !== movementKind) {
      redirectWithMessage("/movements", scope, "error", "La categoria no coincide con el workspace y tipo del movimiento.");
    }

    const generatedDescription =
      movementKind === "expense"
        ? `Gasto en ${categoryData!.name}`
        : `Ingreso por ${categoryData!.name}`;

    const payload = {
      workspace_id: workspaceId,
      movement_date: getRequiredString(formData, "movement_date"),
      description: descriptionValue || generatedDescription,
      amount,
      kind: movementKind,
      account_id: accountId,
      category_id: categoryId,
      notes: notesValue
    };

    const query = typeof id === "string" && id
      ? supabase.from("movements").update(payload).eq("id", id)
      : supabase.from("movements").insert(payload);
    const { error } = await query;

    if (error) {
      redirectWithMessage("/movements", scope, "error", error.message);
    }

    revalidatePath("/");
    revalidatePath("/reports");
    revalidatePath("/accounts");
    revalidatePath("/categories");
    revalidatePath("/movements");
    redirectWithMessage("/movements", scope, "success", typeof id === "string" && id ? "Movimiento actualizado." : "Movimiento creado.");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof Error) {
      redirectWithMessage("/movements", scope, "error", error.message);
    }

    redirectWithMessage("/movements", scope, "error", "No fue posible guardar el movimiento.");
  }
}

export async function deleteMovementAction(formData: FormData) {
  const scope = getScopeValue(formData);

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("movements").delete().eq("id", getRequiredString(formData, "id"));

    if (error) {
      redirectWithMessage("/movements", scope, "error", error.message);
    }

    revalidatePath("/");
    revalidatePath("/reports");
    revalidatePath("/accounts");
    revalidatePath("/categories");
    revalidatePath("/movements");
    redirectWithMessage("/movements", scope, "success", "Movimiento eliminado.");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof Error) {
      redirectWithMessage("/movements", scope, "error", error.message);
    }

    redirectWithMessage("/movements", scope, "error", "No fue posible eliminar el movimiento.");
  }
}

export async function createBusinessWorkspaceAction(formData: FormData) {
  const workspaceName = getOptionalString(formData, "business_workspace_name") ?? "Negocio";

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("complete_onboarding", {
      selected_mode: "personal_and_business",
      business_workspace_name: workspaceName
    });

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/");
    revalidatePath("/reports");
    revalidatePath("/accounts");
    revalidatePath("/categories");
    revalidatePath("/movements");
    redirect(withScope("/", "business", { success: "Workspace de negocio creado." }));
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirect(withScope("/", "personal", {
      error: error instanceof Error ? error.message : "No fue posible crear el workspace de negocio."
    }));
  }
}

export async function saveOnboardingAction(formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    const wantsBusinessWorkspace = formData.get("wants_business_workspace") === "on";
    const businessWorkspaceName = getOptionalString(formData, "business_workspace_name") ?? "Negocio";
    const financialProducts = getValidFinancialProducts(formData);
    const monthlyIncomeEstimate = getOptionalNumberValue(formData, "monthly_income_estimate");
    const monthlyExpenseEstimate = getOptionalNumberValue(formData, "monthly_expense_estimate");

    const { error: onboardingError } = await supabase.rpc("complete_onboarding", {
      selected_mode: wantsBusinessWorkspace ? "personal_and_business" : "personal_only",
      business_workspace_name: businessWorkspaceName
    });

    if (onboardingError) {
      redirect(`/onboarding?error=${encodeURIComponent(onboardingError.message)}`);
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        financial_products: financialProducts,
        monthly_income_estimate: monthlyIncomeEstimate,
        monthly_expense_estimate: monthlyExpenseEstimate
      })
      .eq("id", user.id);

    if (profileError) {
      redirect(`/onboarding?error=${encodeURIComponent(profileError.message)}`);
    }

    revalidatePath("/");
    revalidatePath("/onboarding");
    redirect("/?success=Perfil inicial configurado.");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirect(
      `/onboarding?error=${encodeURIComponent(error instanceof Error ? error.message : "No fue posible guardar el onboarding.")}`
    );
  }
}
