import { EmptyState, MetricCard, SectionCard } from "@/components/ui";
import { getDashboardData } from "@/lib/data/queries";
import { formatCurrency, formatShortDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: {
    scope?: string;
  };
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const data = await getDashboardData(searchParams?.scope);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Ingreso personal del mes" value={formatCurrency(data.totals.personal.income)} tone="positive" />
        <MetricCard label="Gasto personal del mes" value={formatCurrency(data.totals.personal.expense)} tone="warning" />
        <MetricCard label="Balance personal del mes" value={formatCurrency(data.totals.personal.balance)} />
        <MetricCard label="Ingreso negocio del mes" value={formatCurrency(data.totals.business.income)} tone="positive" />
        <MetricCard label="Gasto negocio del mes" value={formatCurrency(data.totals.business.expense)} tone="warning" />
        <MetricCard label="Balance global del mes" value={formatCurrency(data.totals.global.balance)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Balances por cuenta" description="Saldo inicial mas movimientos acumulados del workspace activo.">
          <div className="space-y-3">
            {data.accounts.length === 0 ? (
              <EmptyState message="Crea al menos una cuenta en el workspace activo para empezar." />
            ) : (
              data.accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{account.name}</p>
                    <p className="text-sm text-slate-500">
                      {account.workspace?.name ?? "Workspace"} - {account.workspace?.kind === "personal" ? "Personal" : "Negocio"} - {account.account_type}
                    </p>
                  </div>
                  <p className="text-right text-sm font-semibold text-slate-900">{formatCurrency(account.current_balance, account.currency)}</p>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Insights simples" description="Reglas basicas para detectar alertas utiles.">
          <div className="space-y-3">
            {data.insights.map((insight) => (
              <div key={insight} className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                {insight}
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Gasto por categoria" description="Top categorias del mes actual.">
          {data.reports.expenseByCategory.length === 0 ? (
            <EmptyState message="Aun no hay gastos registrados este mes." />
          ) : (
            <div className="space-y-3">
              {data.reports.expenseByCategory.slice(0, 6).map((item) => (
                <div key={`${item.workspace_kind}-${item.category_name}`} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.category_name}</p>
                    <p className="text-sm text-slate-500">{item.workspace_name} - {item.workspace_kind === "personal" ? "Personal" : "Negocio"}</p>
                  </div>
                  <p className="font-semibold text-slate-900">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Resumen personal vs negocio" description="Comparacion del mes actual por tipo de workspace.">
          <div className="space-y-3">
            {data.reports.personalVsBusiness.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.metrics.balance)}</p>
                </div>
                <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                  <p>Ingresos: {formatCurrency(item.metrics.income)}</p>
                  <p>Gastos: {formatCurrency(item.metrics.expense)}</p>
                  <p>Balance: {formatCurrency(item.metrics.balance)}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <SectionCard title="Ultimos movimientos" description="Vista rapida de la actividad mas reciente del workspace activo.">
        {data.recentMovements.length === 0 ? (
          <EmptyState message="Aun no hay movimientos registrados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3 font-medium">Fecha</th>
                  <th className="pb-3 font-medium">Descripcion</th>
                  <th className="pb-3 font-medium">Workspace</th>
                  <th className="pb-3 font-medium">Cuenta</th>
                  <th className="pb-3 font-medium">Categoria</th>
                  <th className="pb-3 font-medium">Tipo</th>
                  <th className="pb-3 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="py-3 text-slate-600">{formatShortDate(movement.movement_date)}</td>
                    <td className="py-3 font-medium text-slate-900">{movement.description}</td>
                    <td className="py-3 text-slate-600">{movement.workspace?.name ?? "-"}</td>
                    <td className="py-3 text-slate-600">{movement.account?.name ?? "-"}</td>
                    <td className="py-3 text-slate-600">{movement.category?.name ?? "-"}</td>
                    <td className="py-3 text-slate-600">{movement.kind === "income" ? "Ingreso" : "Gasto"}</td>
                    <td className="py-3 text-right font-semibold text-slate-900">{formatCurrency(movement.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
