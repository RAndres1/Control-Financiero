import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Account, Category, Movement, Workspace, WorkspaceKind, WorkspaceScope } from "@/lib/types";
import { getMonthRange, getPreviousMonthRange, getValidWorkspaceScope } from "@/lib/utils";

type MetricSet = {
  income: number;
  expense: number;
  balance: number;
};

type CategoryBreakdown = {
  category_name: string;
  workspace_kind: WorkspaceKind;
  workspace_name: string;
  total: number;
};

type MonthlyComparisonItem = {
  label: string;
  current: MetricSet;
  previous: MetricSet;
};

export type WorkspaceScopeData = {
  scope: WorkspaceScope;
  workspaceIds: string[];
  workspaces: Workspace[];
  availableScopes: WorkspaceScope[];
};

export type DashboardData = {
  workspaceScope: WorkspaceScopeData;
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

function sumByWorkspaceKind(movements: Movement[], workspaceKind?: WorkspaceKind): MetricSet {
  const filtered = workspaceKind ? movements.filter((item) => item.workspace?.kind === workspaceKind) : movements;
  const income = filtered.filter((item) => item.kind === "income").reduce((total, item) => total + Number(item.amount), 0);
  const expense = filtered.filter((item) => item.kind === "expense").reduce((total, item) => total + Number(item.amount), 0);

  return { income, expense, balance: income - expense };
}

function groupByCategory(movements: Movement[], kind: "income" | "expense") {
  const grouped = new Map<string, CategoryBreakdown>();

  movements
    .filter((movement) => movement.kind === kind)
    .forEach((movement) => {
      const workspaceKind = movement.workspace?.kind ?? "personal";
      const workspaceName = movement.workspace?.name ?? (workspaceKind === "personal" ? "Personal" : "Negocio");
      const categoryName = movement.category?.name ?? "Sin categoria";
      const key = `${workspaceKind}:${categoryName}`;
      const current = grouped.get(key);

      if (current) {
        current.total += Number(movement.amount);
        return;
      }

      grouped.set(key, {
        category_name: categoryName,
        workspace_kind: workspaceKind,
        workspace_name: workspaceName,
        total: Number(movement.amount)
      });
    });

  return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
}

function buildInsights(currentMonth: Movement[], previousMonth: Movement[]) {
  const insights: string[] = [];
  const currentPersonal = sumByWorkspaceKind(currentMonth, "personal");
  const currentBusiness = sumByWorkspaceKind(currentMonth, "business");
  const currentGlobal = sumByWorkspaceKind(currentMonth);
  const previousGlobal = sumByWorkspaceKind(previousMonth);
  const currentExpenses = currentMonth.filter((item) => item.kind === "expense");
  const personalExpenses = currentMonth.filter((item) => item.kind === "expense" && item.workspace?.kind === "personal");

  if (currentGlobal.expense > previousGlobal.expense && previousGlobal.expense > 0) {
    const growth = Math.round(((currentGlobal.expense - previousGlobal.expense) / previousGlobal.expense) * 100);
    insights.push(`Este mes gastaste ${growth}% mas que el mes anterior. Revisa primero las categorias variables.`);
  }

  if (currentExpenses.length > 0) {
    const topExpenseCategory = groupByCategory(currentMonth, "expense")[0];
    if (topExpenseCategory) {
      insights.push(
        `Tu mayor gasto del mes esta en ${topExpenseCategory.category_name} (${topExpenseCategory.workspace_kind === "personal" ? "personal" : "negocio"}), con ${topExpenseCategory.total.toLocaleString("es-CO")} en total.`
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

  if (personalExpenses.length > 0 && currentPersonal.expense > 0) {
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
      const current = currentAccountDrops.get(item.account_id);
      currentAccountDrops.set(item.account_id, {
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

function resolveAvailableScopes(workspaces: Workspace[]) {
  const scopes: WorkspaceScope[] = [];
  const hasPersonal = workspaces.some((workspace) => workspace.kind === "personal");
  const hasBusiness = workspaces.some((workspace) => workspace.kind === "business");

  if (hasPersonal) {
    scopes.push("personal");
  }

  if (hasBusiness) {
    scopes.push("business");
  }

  if (hasPersonal && hasBusiness) {
    scopes.push("all");
  }

  return scopes;
}

function resolveScope(workspaces: Workspace[], requestedScope?: string): WorkspaceScope {
  const availableScopes = resolveAvailableScopes(workspaces);
  const preferredScope = getValidWorkspaceScope(requestedScope);

  if (availableScopes.includes(preferredScope)) {
    return preferredScope;
  }

  return availableScopes[0] ?? "personal";
}

export async function getWorkspaceScopeData(requestedScope?: string): Promise<WorkspaceScopeData> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("workspaces").select("*").order("kind").order("name");

  if (error) {
    throw new Error(error.message);
  }

  const workspaces = (data ?? []) as Workspace[];
  const scope = resolveScope(workspaces, requestedScope);
  const availableScopes = resolveAvailableScopes(workspaces);
  const workspaceIds = scope === "all"
    ? workspaces.map((workspace) => workspace.id)
    : workspaces.filter((workspace) => workspace.kind === scope).map((workspace) => workspace.id);

  return {
    scope,
    workspaceIds,
    workspaces,
    availableScopes
  };
}

export async function getAccounts(workspaceIds: string[]) {
  if (workspaceIds.length === 0) {
    return [] as Account[];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*, workspace:workspaces(id, name, kind)")
    .in("workspace_id", workspaceIds)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Account[];
}

export async function getAccountsWithBalance(workspaceIds: string[]) {
  if (workspaceIds.length === 0) {
    return [] as Array<Account & { current_balance: number }>;
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: accountsData, error: accountsError }, { data: movementsData, error: movementsError }] = await Promise.all([
    supabase
      .from("accounts")
      .select("*, workspace:workspaces(id, name, kind)")
      .in("workspace_id", workspaceIds)
      .order("name"),
    supabase.from("movements").select("account_id, amount, kind").in("workspace_id", workspaceIds)
  ]);

  if (accountsError || movementsError) {
    throw new Error(accountsError?.message || movementsError?.message);
  }

  const accounts = (accountsData ?? []) as unknown as Account[];
  const movements = (movementsData ?? []) as Pick<Movement, "account_id" | "amount" | "kind">[];

  return withAccountBalances(accounts, movements);
}

export async function getCategories(workspaceIds: string[]) {
  if (workspaceIds.length === 0) {
    return [] as Category[];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*, workspace:workspaces(id, name, kind)")
    .in("workspace_id", workspaceIds)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Category[];
}

export async function getMovements(workspaceIds: string[], limit?: number) {
  if (workspaceIds.length === 0) {
    return [] as Movement[];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("movements")
    .select("*, account:accounts(name), category:categories(name), workspace:workspaces(id, name, kind)")
    .in("workspace_id", workspaceIds)
    .order("movement_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Movement[];
}

export async function getFilteredMovements(
  workspaceIds: string[],
  filters?: {
    kind?: string;
    accountId?: string;
    categoryId?: string;
    month?: string;
  }
) {
  if (workspaceIds.length === 0) {
    return [] as Movement[];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("movements")
    .select("*, account:accounts(name), category:categories(name), workspace:workspaces(id, name, kind)")
    .in("workspace_id", workspaceIds)
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
  return (data ?? []) as unknown as Movement[];
}

export async function getDashboardData(requestedScope?: string): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient();
  const workspaceScope = await getWorkspaceScopeData(requestedScope);
  const currentRange = getMonthRange();
  const previousRange = getPreviousMonthRange();

  if (workspaceScope.workspaceIds.length === 0) {
    return {
      workspaceScope,
      totals: {
        personal: { income: 0, expense: 0, balance: 0 },
        business: { income: 0, expense: 0, balance: 0 },
        global: { income: 0, expense: 0, balance: 0 }
      },
      accounts: [],
      recentMovements: [],
      insights: ["No hay workspaces disponibles todavia."],
      reports: {
        expenseByCategory: [],
        incomeByCategory: [],
        monthlyComparison: [
          { label: "Personal", current: { income: 0, expense: 0, balance: 0 }, previous: { income: 0, expense: 0, balance: 0 } },
          { label: "Negocio", current: { income: 0, expense: 0, balance: 0 }, previous: { income: 0, expense: 0, balance: 0 } },
          { label: "Global", current: { income: 0, expense: 0, balance: 0 }, previous: { income: 0, expense: 0, balance: 0 } }
        ],
        personalVsBusiness: [
          { label: "Personal", metrics: { income: 0, expense: 0, balance: 0 } },
          { label: "Negocio", metrics: { income: 0, expense: 0, balance: 0 } }
        ],
        netFlow: {
          currentMonth: 0,
          previousMonth: 0
        }
      }
    };
  }

  const [
    { data: accountsData, error: accountsError },
    { data: movementsData, error: movementsError },
    { data: currentData, error: currentError },
    { data: previousData, error: previousError }
  ] = await Promise.all([
    supabase
      .from("accounts")
      .select("*, workspace:workspaces(id, name, kind)")
      .in("workspace_id", workspaceScope.workspaceIds)
      .order("name"),
    supabase
      .from("movements")
      .select("*, account:accounts(name), category:categories(name), workspace:workspaces(id, name, kind)")
      .in("workspace_id", workspaceScope.workspaceIds)
      .order("movement_date", { ascending: false }),
    supabase
      .from("movements")
      .select("*, account:accounts(name), category:categories(name), workspace:workspaces(id, name, kind)")
      .in("workspace_id", workspaceScope.workspaceIds)
      .gte("movement_date", currentRange.start)
      .lte("movement_date", currentRange.end),
    supabase
      .from("movements")
      .select("*, account:accounts(name), category:categories(name), workspace:workspaces(id, name, kind)")
      .in("workspace_id", workspaceScope.workspaceIds)
      .gte("movement_date", previousRange.start)
      .lte("movement_date", previousRange.end)
  ]);

  if (accountsError || movementsError || currentError || previousError) {
    throw new Error(accountsError?.message || movementsError?.message || currentError?.message || previousError?.message);
  }

  const accounts = (accountsData ?? []) as unknown as Account[];
  const movements = (movementsData ?? []) as unknown as Movement[];
  const currentMonthMovements = (currentData ?? []) as unknown as Movement[];
  const previousMonthMovements = (previousData ?? []) as unknown as Movement[];
  const accountsWithBalance = withAccountBalances(accounts, movements);
  const currentPersonal = sumByWorkspaceKind(currentMonthMovements, "personal");
  const currentBusiness = sumByWorkspaceKind(currentMonthMovements, "business");
  const currentGlobal = sumByWorkspaceKind(currentMonthMovements);
  const previousPersonal = sumByWorkspaceKind(previousMonthMovements, "personal");
  const previousBusiness = sumByWorkspaceKind(previousMonthMovements, "business");
  const previousGlobal = sumByWorkspaceKind(previousMonthMovements);

  return {
    workspaceScope,
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
