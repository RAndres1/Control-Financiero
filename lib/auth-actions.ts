"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing field: ${key}`);
  }
  return value.trim();
}

function redirectWithMessage(message: string) {
  redirect(`/login?error=${encodeURIComponent(message)}`);
}

export async function loginAction(formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    const email = getRequiredString(formData, "email");
    const password = getRequiredString(formData, "password");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      redirectWithMessage(error.message);
    }

    redirect("/");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirectWithMessage(error instanceof Error ? error.message : "No fue posible iniciar sesion.");
  }
}

export async function signupAction(formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    const email = getRequiredString(formData, "email");
    const password = getRequiredString(formData, "password");

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      redirectWithMessage(error.message);
    }

    if (!data.session) {
      redirect(`/login?success=${encodeURIComponent("Usuario creado. Revisa tu correo para confirmar la cuenta.")}`);
    }

    redirect("/");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirectWithMessage(error instanceof Error ? error.message : "No fue posible crear la cuenta.");
  }
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
