import { saveOnboardingAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

type OnboardingPageProps = {
  searchParams?: {
    error?: string;
  };
};

const incomeOptions = [
  { value: "1500000", label: "Menos de 1.5M" },
  { value: "3000000", label: "Entre 1.5M y 3M" },
  { value: "5000000", label: "Entre 3M y 5M" },
  { value: "8000000", label: "Entre 5M y 8M" },
  { value: "12000000", label: "Mas de 8M" }
];

const expenseOptions = [
  { value: "1000000", label: "Menos de 1M" },
  { value: "2500000", label: "Entre 1M y 2.5M" },
  { value: "4000000", label: "Entre 2.5M y 4M" },
  { value: "6000000", label: "Entre 4M y 6M" },
  { value: "9000000", label: "Mas de 6M" }
];

export default function OnboardingPage({ searchParams }: OnboardingPageProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[28px] bg-ink px-8 py-10 text-white shadow-soft">
          <p className="mb-3 text-sm uppercase tracking-[0.24em] text-emerald-200">Primeros 2 minutos</p>
          <h1 className="text-4xl font-semibold tracking-tight">Vamos a dejar la app lista para ti.</h1>
          <p className="mt-4 text-slate-300">
            Solo necesitamos una referencia simple para mostrar mejores recomendaciones y reducir pasos al registrar movimientos.
          </p>
          <div className="mt-8 space-y-3 text-sm text-slate-300">
            <p>1. Que productos financieros usas.</p>
            <p>2. Cuanto entra al mes aproximadamente.</p>
            <p>3. Cuanto sale al mes aproximadamente.</p>
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-6 shadow-soft ring-1 ring-slate-200/70 sm:p-8">
          {searchParams?.error ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{searchParams.error}</div>
          ) : null}

          <form action={saveOnboardingAction} className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Tu punto de partida</h2>
              <p className="mt-1 text-sm text-slate-500">No buscamos exactitud. Solo una base inicial util.</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Que productos financieros usas hoy</label>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  <input type="checkbox" name="financial_products" value="bank_account" className="mr-2 h-4 w-4" />
                  Cuentas
                </label>
                <label className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  <input type="checkbox" name="financial_products" value="credit_card" className="mr-2 h-4 w-4" />
                  Tarjetas
                </label>
                <label className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  <input type="checkbox" name="financial_products" value="loan" className="mr-2 h-4 w-4" />
                  Creditos
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Ingreso mensual aproximado</label>
                <select name="monthly_income_estimate" defaultValue="3000000">
                  {incomeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Gasto mensual aproximado</label>
                <select name="monthly_expense_estimate" defaultValue="2500000">
                  {expenseOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input type="checkbox" name="wants_business_workspace" className="mt-0.5 h-4 w-4" />
                <span>
                  Tambien quiero separar finanzas de negocio.
                  <span className="mt-1 block text-slate-500">Si lo activas, te creamos un workspace extra para no mezclar todo.</span>
                </span>
              </label>
              <div className="mt-3">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nombre del negocio</label>
                <input name="business_workspace_name" defaultValue="Negocio" placeholder="Ej: Tienda, Consultoria, Marca" />
              </div>
            </div>

            <button type="submit" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
              Empezar
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
