import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/database.types";

const publicRoutes = ["/login"];

function isProfileOnboardingComplete(
  profileData:
    | {
        onboarding_completed?: boolean | null;
        financial_products?: string[] | null;
        monthly_income_estimate?: number | null;
        monthly_expense_estimate?: number | null;
      }
    | null
) {
  if (!profileData?.onboarding_completed) {
    return false;
  }

  const financialProducts = profileData.financial_products ?? [];
  const hasIncomeEstimate = profileData.monthly_income_estimate !== null && profileData.monthly_income_estimate !== undefined;
  const hasExpenseEstimate = profileData.monthly_expense_estimate !== null && profileData.monthly_expense_estimate !== undefined;

  return financialProducts.length > 0 && hasIncomeEstimate && hasExpenseEstimate;
}

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return response;
  }

  const supabase = createServerClient<Database>(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route));

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("onboarding_completed, financial_products, monthly_income_estimate, monthly_expense_estimate")
      .eq("id", user.id)
      .maybeSingle();

    const onboardingCompleted = isProfileOnboardingComplete(profileData);

    if (!onboardingCompleted && request.nextUrl.pathname !== "/onboarding") {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if (onboardingCompleted && request.nextUrl.pathname === "/onboarding") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    if (request.nextUrl.pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
