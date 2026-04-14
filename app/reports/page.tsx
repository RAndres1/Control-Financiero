import { EmptyState, SectionCard } from "@/components/ui";
import { getDashboardData } from "@/lib/data/queries";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Gasto por categoria" description="Distribucion simple del gasto del mes actual.">
          {data.reports.expenseByCategory.length === 0 ? (
            <EmptyState message="No hay gastos registrados este mes." />
          ) : (
            <div className="space-y-3">
              {data.reports.expenseByCategory.map((item) => (
                <div key={`${item.owner_type}-${item.category_name}`} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.category_name}</p>
                    <p className="text-sm text-slate-500">{item.owner_type === "personal" ? "Personal" : "Negocio"}</p>
                  </div>
                  <p className="font-semibold text-slate-900">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Ingreso por categoria" description="Fuentes de ingreso del mes actual.">
          {data.reports.incomeByCategory.length === 0 ? (
            <EmptyState message="No hay ingresos registrados este mes." />
          ) : (
            <div className="space-y-3">
              {data.reports.incomeByCategory.map((item) => (
                <div key={`${item.owner_type}-${item.category_name}`} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.category_name}</p>
                    <p className="text-sm text-slate-500">{item.owner_type === "personal" ? "Personal" : "Negocio"}</p>
                  </div>
                  <p className="font-semibold text-slate-900">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Comparacion mensual simple" description="Mes actual vs mes anterior.">
          <div className="space-y-3">
            {data.reports.monthlyComparison.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <p className="text-sm text-slate-500">Actual vs anterior</p>
                </div>
                <div className="grid gap-2 text-sm text-slate-600 lg:grid-cols-3">
                  <p>Ingresos: {formatCurrency(item.current.income)} / {formatCurrency(item.previous.income)}</p>
                  <p>Gastos: {formatCurrency(item.current.expense)} / {formatCurrency(item.previous.expense)}</p>
                  <p>Balance: {formatCurrency(item.current.balance)} / {formatCurrency(item.previous.balance)}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Flujo neto del mes" description="Lectura rapida del resultado actual.">
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 px-4 py-3">
              <p className="text-sm text-slate-500">Mes actual</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(data.reports.netFlow.currentMonth)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3">
              <p className="text-sm text-slate-500">Mes anterior</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(data.reports.netFlow.previousMonth)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3">
              <p className="text-sm text-slate-500">Resumen personal vs negocio</p>
              <div className="mt-2 space-y-2 text-sm text-slate-600">
                {data.reports.personalVsBusiness.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span>{item.label}</span>
                    <span className="font-medium text-slate-900">{formatCurrency(item.metrics.balance)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
