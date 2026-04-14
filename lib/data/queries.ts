import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Account, Category, Movement, OwnerType } from "@/lib/types";
import { getMonthRange, getPreviousMonthRange } from "@/lib/utils";

type MetricSet = {
  income: number;
  expense: number;
  balance: number;
};

type CategoryBreakdown = {
  category_name: string;
  owner_type: OwnerType;
  total: number;
};

type MonthlyComparisonItem = {
  label: string;
  current: MetricSet;
  previous: MetricSet;
};

export type DashboardData = {
  totals: {
    personal: MetricSet;
    business: MetricSet;
    global: MetricSet;
  };
  accounts: Array<Account & { current_balance: number }>;
  recentMovements: Movement[];
  insights: string[];
  reports: {
    expenseByCategory: CategoryBreakdown[];
    incomeByCategory: CategoryBreakdown[];
    monthlyComparison: MonthlyComparisonItem[];
    personalVsBusiness: Array<{ label: string; metrics: MetricSet }>;
    netFlow: {
      currentMonth: number;
      previousMonth: number;
    };
  };
};

function sumByKind(movements: Movement[], ownerType?: OwnerType): MetricSet {
  const filtered = ownerType ? movements.filter((item) => item.owner_type === ownerType) : movements;
  const income = filtered.filter((item) => item.kind === "income").reduce((total, item) => total + Number(item.amount), 0);
  const expense = filtered.filter((item) => item.kind === "expense").reduce((total, item) => total + Number(item.amount), 0);

  return { income, expense, balance: income - expense };
}

function buildInsights(currentMonth: Movement[], previousMonth: Movement[]) {
  const insights: string[] = [];
  const currentPersonal = sumByKind(currentMonth, "personal");
  const previousPersonal = sumByKind(previousMonth, "personal");
  const currentBusiness = sumByKind(currentMonth, "business");
  const previousBusiness = sumByKind(previousMonth, "business");
  const currentGlobal = sumByKind(currentMonth);
  const previousGlobal = sumByKind(previousMonth);

  const currentExpenses = currentMonth.filter((item) => item.kind === "expense");
  const personalExpenses = currentMonth.filter((item) => item.kind === "expense" && item.owner_type === "personal");

  if (currentGlobal.expense > previousGlobal.expense && previousGlobal.expense > 0) {
    const growth = Math.round(((currentGlobal.expense - previousGlobal.expense) / previousGlobal.expense) * 100);
    insights.push(`Este mes gastaste ${growth}% mas que el mes anterior. Revisa primero las categorias variables.`);
  }

  if (currentExpenses.length > 0) {
    const topExpenseCategory = groupByCategory(currentMonth, "expense")[0];
    if (topExpenseCategory) {
      insights.push(
        `Tu mayor gasto del mes esta en ${topExpenseCategory.category_name} (${topExpenseCategory.owner_type === "personal" ? "personal" : "negocio"}), con ${topExpenseCategory.total.toLocaleString("es-CO")} en total.`
      );
    }
  }

  if (currentBusiness.expense > currentBusiness.income) {
    const gap = currentBusiness.expense - currentBusiness.income;
    insights.push(`El negocio gasto ${gap.toLocaleString("es-CO")} mas de lo que ingreso este mes. Ajusta costos o empuja ventas.`);
  }

  if (currentGlobal.balance < 0) {
    insights.push("Tu flujo neto del mes es negativo. Revisa primero los gastos variables.");
  }

  if (personalExpenses.length > 0) {
    const personalExpenseCategories = groupByCategory(personalExpenses, "expense");
    const topTwoShare =
      personalExpenseCategories.slice(0, 2).reduce((total, item) => total + item.total, 0) / currentPersonal.expense;

    if (personalExpenseCategories.length <= 2 || topTwoShare >= 0.7) {
      insights.push("Tus gastos personales estan muy concentrados en pocas categorias. Ahorrar ahi tendria mayor impacto.");
    }
  }

  const currentAccountDrops = new Map<string, { name: string; expense: number }>();
  const previousAccountDrops = new Map<string, number>();

  currentMonth
    .filter((item) => item.kind === "expense")
    .forEach((item) => {
      const key = item.account_id;
      const current = currentAccountDrops.get(key);
      currentAccountDrops.set(key, {
        name: item.account?.name ?? "Cuenta",
        expense: (current?.expense ?? 0) + Number(item.amount)
      });
    });

  previousMonth
    .filter((item) => item.kind === "expense")
    .forEach((item) => {
      previousAccountDrops.set(item.account_id, (previousAccountDrops.get(item.account_id) ?? 0) + Number(item.amount));
    });

  const fastestDrop = Array.from(currentAccountDrops.entries())
    .map(([accountId, account]) => {
      const previousExpense = previousAccountDrops.get(accountId) ?? 0;
      return {
        name: account.name,
        currentExpense: account.expense,
        previousExpense
      };
    })
    .filter((item) => item.previousExpense > 0 && item.currentExpense > item.previousExpense)
    .sort((a, b) => (b.currentExpense - b.previousExpense) - (a.currentExpense - a.previousExpense))[0];

  if (fastestDrop) {
    const growth = Math.round(((fastestDrop.currentExpense - fastestDrop.previousExpense) / fastestDrop.previousExpense) * 100);
    insights.push(`La cuenta ${fastestDrop.name} esta saliendo mas rapido que el mes anterior: ${growth}% mas en gastos.`);
  }

  if (insights.length === 0) {
    insights.push("No hay alertas relevantes por ahora. Mantener el registro al dia ya es una ventaja.");
  }

  return insights.slice(0, 6);
}

function withAccountBalances(accounts: Account[], movements: Pick<Movement, "account_id" | "amount" | "kind">[]) {
  return accounts.map((account) => {
    const delta = movements
      .filter((item) => item.account_id === account.id)
      .reduce((total, item) => total + (item.kind === "income" ? Number(item.amount) : -Number(item.amount)), 0);

    return {
      ...account,
      current_balance: Number(account.initial_balance) + delta
    };
  });
}

function groupByCategory(movements: Movement[], kind: "income" | "expense") {
  const grouped = new Map<string, CategoryBreakdown>();

  movements
    .filter((movement) => movement.kind === kind)
    .forEach((movement) => {
      const key = `${movement.owner_type}:${movement.category?.name ?? "Sin categoria"}`;
      const current = grouped.get(key);

      if (current) {
        current.total += Number(movement.amount);
        return;
      }

      grouped.set(key, {
        category_name: movement.category?.name ?? "Sin categoria",
        owner_type: movement.owner_type,
        total: Number(movement.amount)
      });
    });

  return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
}

export async function getAccounts() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("accounts").select("*").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as Account[];
}

export async function getAccountsWithBalance() {
  const supabase = createSupabaseServerClient();
  const [{ data: accountsData, error: accountsError }, { data: movementsData, error: movementsError }] = await Promise.all([
    supabase.from("accounts").select("*").order("name"),
    supabase.from("movements").select("account_id, amount, kind")
  ]);

  if (accountsError || movementsError) {
    throw new Error(accountsError?.message || movementsError?.message);
  }

  const accounts = (accountsData ?? []) as Account[];
  const movements = (movementsData ?? []) as Pick<Movement, "account_id" | "amount" | "kind">[];

  return withAccountBalances(accounts, movements);
}

export async function getCategories() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

export async function getMovements(limit?: number) {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("movements")
    .select("*, account:accounts(name), category:categories(name)")
    .order("movement_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Movement[];
}

export async function getFilteredMovements(filters?: {
  kind?: string;
  accountId?: string;
  categoryId?: string;
  month?: string;
}) {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("movements")
    .select("*, account:accounts(name), category:categories(name)")
    .order("movement_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.kind && ["income", "expense"].includes(filters.kind)) {
    query = query.eq("kind", filters.kind as "income" | "expense");
  }

  if (filters?.accountId) {
    query = query.eq("account_id", filters.accountId);
  }

  if (filters?.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters?.month && /^\d{4}-\d{2}$/.test(filters.month)) {
    const start = `${filters.month}-01`;
    const end = new Date(`${filters.month}-01T00:00:00`);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    query = query.gte("movement_date", start).lte("movement_date", end.toISOString().slice(0, 10));
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Movement[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createSupabaseServerClient();
  const currentRange = getMonthRange();
  const previousRange = getPreviousMonthRange();

  const [
    { data: accountsData, error: accountsError },
    { data: movementsData, error: movementsError },
    { data: currentData, error: currentError },
    { data: previousData, error: previousError }
  ] = await Promise.all([
    supabase.from("accounts").select("*").order("name"),
    supabase.from("movements").select("*, account:accounts(name), category:categories(name)").order("movement_date", { ascending: false }),
    supabase
      .from("movements")
      .select("*, account:accounts(name), category:categories(name)")
      .gte("movement_date", currentRange.start)
      .lte("movement_date", currentRange.end),
    supabase
      .from("movements")
      .select("*, account:accounts(name), category:categories(name)")
      .gte("movement_date", previousRange.start)
      .lte("movement_date", previousRange.end)
  ]);

  if (accountsError || movementsError || currentError || previousError) {
    throw new Error(accountsError?.message || movementsError?.message || currentError?.message || previousError?.message);
  }

  const accounts = (accountsData ?? []) as Account[];
  const movements = (movementsData ?? []) as Movement[];
  const currentMonthMovements = (currentData ?? []) as Movement[];
  const previousMonthMovements = (previousData ?? []) as Movement[];
  const accountsWithBalance = withAccountBalances(accounts, movements);
  const currentPersonal = sumByKind(currentMonthMovements, "personal");
  const currentBusiness = sumByKind(currentMonthMovements, "business");
  const currentGlobal = sumByKind(currentMonthMovements);
  const previousPersonal = sumByKind(previousMonthMovements, "personal");
  const previousBusiness = sumByKind(previousMonthMovements, "business");
  const previousGlobal = sumByKind(previousMonthMovements);

  return {
    totals: {
      personal: currentPersonal,
      business: currentBusiness,
      global: currentGlobal
    },
    accounts: accountsWithBalance,
    recentMovements: movements.slice(0, 8),
    insights: buildInsights(currentMonthMovements, previousMonthMovements),
    reports: {
      expenseByCategory: groupByCategory(currentMonthMovements, "expense"),
      incomeByCategory: groupByCategory(currentMonthMovements, "income"),
      monthlyComparison: [
        { label: "Personal", current: currentPersonal, previous: previousPersonal },
        { label: "Negocio", current: currentBusiness, previous: previousBusiness },
        { label: "Global", current: currentGlobal, previous: previousGlobal }
      ],
      personalVsBusiness: [
        { label: "Personal", metrics: currentPersonal },
        { label: "Negocio", metrics: currentBusiness }
      ],
      netFlow: {
        currentMonth: currentGlobal.balance,
        previousMonth: previousGlobal.balance
      }
    }
  };
}
