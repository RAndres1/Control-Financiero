export function formatCurrency(value: number, currency = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}

export function getMonthRange(baseDate = new Date()) {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function getPreviousMonthRange(baseDate = new Date()) {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1);
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth(), 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function getValidWorkspaceScope(value?: string): "personal" | "business" | "all" {
  if (value === "personal" || value === "business" || value === "all") {
    return value;
  }

  return "personal";
}

export function withScope(path: string, scope?: string, extraParams?: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  if (scope) {
    params.set("scope", scope);
  }

  Object.entries(extraParams ?? {}).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
