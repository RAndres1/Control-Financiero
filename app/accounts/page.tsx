import { DeleteButton, EmptyState, SectionCard, SubmitButton } from "@/components/ui";
import { deleteAccountAction, saveAccountAction } from "@/lib/actions";
import { getAccountsWithBalance } from "@/lib/data/queries";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AccountsPageProps = {
  searchParams?: {
    edit?: string;
    error?: string;
    success?: string;
  };
};

export default async function AccountsPage({ searchParams }: AccountsPageProps) {
  const accounts = await getAccountsWithBalance();
  const editing = accounts.find((item) => item.id === searchParams?.edit);
  const errorMessage = searchParams?.error;
  const successMessage = searchParams?.success;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard title={editing ? "Editar cuenta" : "Nueva cuenta"} description="CRUD simple de cuentas personales y del negocio.">
        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
        ) : null}
        {successMessage ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
        ) : null}

        <form action={saveAccountAction} className="space-y-4">
          <input type="hidden" name="id" defaultValue={editing?.id} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nombre</label>
            <input name="name" defaultValue={editing?.name} placeholder="Ej: Bancolombia Ahorros" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Ambito</label>
              <select name="owner_type" defaultValue={editing?.owner_type ?? "personal"}>
                <option value="personal">Personal</option>
                <option value="business">Negocio</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Tipo</label>
              <select name="account_type" defaultValue={editing?.account_type ?? "bank"}>
                <option value="bank">Banco</option>
                <option value="cash">Efectivo</option>
                <option value="wallet">Billetera</option>
                <option value="credit_card">Tarjeta credito</option>
                <option value="savings">Ahorro</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Moneda</label>
              <input name="currency" defaultValue={editing?.currency ?? "COP"} maxLength={3} required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Saldo inicial</label>
              <input name="initial_balance" type="number" min="0" step="0.01" defaultValue={editing?.initial_balance ?? 0} required />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="is_active" className="h-4 w-4" defaultChecked={editing?.is_active ?? true} />
            Cuenta activa
          </label>
          <div className="flex gap-3">
            <SubmitButton label={editing ? "Actualizar cuenta" : "Guardar cuenta"} />
            {editing ? <a href="/accounts" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Cancelar</a> : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Cuentas registradas" description="Base de cuentas para clasificar movimientos.">
        {accounts.length === 0 ? (
          <EmptyState message="Todavia no hay cuentas registradas." />
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{account.name}</p>
                    <p className="text-sm text-slate-500">
                      {account.owner_type === "personal" ? "Personal" : "Negocio"} - {account.account_type} - {account.is_active ? "Activa" : "Inactiva"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Saldo inicial: {formatCurrency(account.initial_balance, account.currency)} - Saldo actual: {formatCurrency(account.current_balance, account.currency)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a href={`/accounts?edit=${account.id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Editar</a>
                    <form action={deleteAccountAction}>
                      <input type="hidden" name="id" value={account.id} />
                      <DeleteButton />
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
