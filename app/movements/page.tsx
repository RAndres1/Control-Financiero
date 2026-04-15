import { MovementCategoryField } from "@/components/movement-category-field";
import { DeleteButton, EmptyState, SectionCard, SubmitButton } from "@/components/ui";
import { deleteMovementAction, saveMovementAction } from "@/lib/actions";
import { getAccounts, getCategories, getFilteredMovements, getMovements, getWorkspaceScopeData } from "@/lib/data/queries";
import { formatCurrency, formatShortDate, withScope } from "@/lib/utils";

export const dynamic = "force-dynamic";

type MovementsPageProps = {
  searchParams?: {
    edit?: string;
    error?: string;
    success?: string;
    scope?: string;
    kind?: string;
    account_id?: string;
    category_id?: string;
    month?: string;
  };
};

export default async function MovementsPage({ searchParams }: MovementsPageProps) {
  const workspaceScope = await getWorkspaceScopeData(searchParams?.scope);
  const filters = {
    kind: searchParams?.kind,
    accountId: searchParams?.account_id,
    categoryId: searchParams?.category_id,
    month: searchParams?.month
  };

  const [accounts, categories, movements, latestMovements] = await Promise.all([
    getAccounts(workspaceScope.workspaceIds),
    getCategories(workspaceScope.workspaceIds),
    getFilteredMovements(workspaceScope.workspaceIds, filters),
    getMovements(workspaceScope.workspaceIds, 1)
  ]);

  const editing = movements.find((item) => item.id === searchParams?.edit);
  const latestMovement = latestMovements[0];
  const errorMessage = searchParams?.error;
  const successMessage = searchParams?.success;
  const formWorkspaces = workspaceScope.scope === "all"
    ? workspaceScope.workspaces
    : workspaceScope.workspaces.filter((workspace) => workspace.kind === workspaceScope.scope);
  const defaultMovementDate = editing?.movement_date ?? new Date().toISOString().slice(0, 10);
  const defaultWorkspaceId = editing?.workspace_id ?? latestMovement?.workspace_id ?? formWorkspaces[0]?.id;
  const defaultKind = editing?.kind ?? latestMovement?.kind ?? "expense";
  const defaultAccountId = editing?.account_id ?? latestMovement?.account_id;
  const defaultCategoryId = editing?.category_id ?? latestMovement?.category_id;

  return (
    <div className="space-y-6">
      <SectionCard
        title={editing ? "Editar movimiento" : "Registrar movimiento"}
        description={
          editing
            ? "Ajusta el registro y guarda."
            : "Captura rapida: monto primero, tipo rapido y solo lo necesario visible."
        }
      >
        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
        ) : null}
        {successMessage ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
        ) : null}

        <form action={saveMovementAction} className="space-y-5">
          <input type="hidden" name="id" defaultValue={editing?.id} />
          <input type="hidden" name="scope" value={workspaceScope.scope} />
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-slate-500">Monto</label>
            <div className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 focus-within:border-slate-400">
              <span className="text-3xl font-semibold text-slate-400">$</span>
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={editing?.amount}
                required
                placeholder="0"
                className="h-auto border-0 bg-transparent px-0 py-0 text-4xl font-semibold tracking-tight text-slate-900 shadow-none placeholder:text-slate-300 focus:ring-0"
              />
            </div>
            <p className="mt-2 text-sm text-slate-500">Empieza por aqui. Luego confirma tipo, categoria y cuenta.</p>
          </div>

          <MovementCategoryField
            accounts={accounts}
            categories={categories}
            workspaces={formWorkspaces}
            defaultWorkspaceId={defaultWorkspaceId}
            defaultKind={defaultKind}
            defaultAccountId={defaultAccountId}
            defaultCategoryId={defaultCategoryId}
          />

          <details className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <summary className="cursor-pointer list-none text-sm font-medium text-slate-700">
              Detalles opcionales
            </summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Fecha</label>
                <input name="movement_date" type="date" defaultValue={defaultMovementDate} required className="h-12 rounded-2xl bg-white" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Descripcion corta</label>
                <input
                  name="description"
                  defaultValue={editing?.description === "Movimiento sin descripcion" ? "" : editing?.description}
                  placeholder="Opcional"
                  className="h-12 rounded-2xl bg-white"
                />
                <p className="mt-1 text-xs text-slate-500">Si la dejas vacia, usamos una descripcion automatica segun la categoria.</p>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Notas</label>
                <textarea
                  name="notes"
                  defaultValue={editing?.notes ?? ""}
                  placeholder="Opcional"
                  rows={2}
                  className="rounded-2xl bg-white"
                />
                <p className="mt-1 text-xs text-slate-500">Solo si necesitas contexto extra. No es obligatorio para registrar.</p>
              </div>
            </div>
          </details>

          <div className="flex flex-wrap gap-3">
            <SubmitButton label={editing ? "Actualizar movimiento" : "Guardar movimiento"} />
            {editing ? (
              <a href={withScope("/movements", workspaceScope.scope)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                Cancelar
              </a>
            ) : null}
            {!editing && latestMovement ? (
              <p className="self-center text-sm text-slate-500">
                Usando por defecto tu ultima seleccion de cuenta y categoria.
              </p>
            ) : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Filtros" description="Filtra sin complicar el flujo principal.">
        <form action="/movements" className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <input type="hidden" name="scope" value={workspaceScope.scope} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Tipo</label>
            <select name="kind" defaultValue={searchParams?.kind ?? ""}>
              <option value="">Todos</option>
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Cuenta</label>
            <select name="account_id" defaultValue={searchParams?.account_id ?? ""}>
              <option value="">Todas</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Categoria</label>
            <select name="category_id" defaultValue={searchParams?.category_id ?? ""}>
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Mes</label>
            <input name="month" type="month" defaultValue={searchParams?.month ?? ""} />
          </div>
          <div className="flex items-end gap-3">
            <SubmitButton label="Filtrar" />
            <a href={withScope("/movements", workspaceScope.scope)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
              Limpiar
            </a>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Historial de movimientos" description="Ordenado por fecha descendente.">
        {movements.length === 0 ? (
          <EmptyState message="No hay movimientos para el workspace activo o los filtros actuales." />
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
                  <th className="pb-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="py-3 text-slate-600">{formatShortDate(movement.movement_date)}</td>
                    <td className="py-3 font-medium text-slate-900">{movement.description}</td>
                    <td className="py-3 text-slate-600">{movement.workspace?.name ?? "-"}</td>
                    <td className="py-3 text-slate-600">{movement.account?.name ?? "-"}</td>
                    <td className="py-3 text-slate-600">{movement.category?.name ?? "-"}</td>
                    <td className="py-3 text-slate-600">{movement.kind === "income" ? "Ingreso" : "Gasto"}</td>
                    <td className="py-3 text-right font-semibold text-slate-900">{formatCurrency(movement.amount)}</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <a href={withScope("/movements", workspaceScope.scope, { edit: movement.id })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                          Editar
                        </a>
                        <form action={deleteMovementAction}>
                          <input type="hidden" name="id" value={movement.id} />
                          <input type="hidden" name="scope" value={workspaceScope.scope} />
                          <DeleteButton />
                        </form>
                      </div>
                    </td>
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
