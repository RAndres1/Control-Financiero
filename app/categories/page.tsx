import { DeleteButton, EmptyState, SectionCard, SubmitButton } from "@/components/ui";
import { deleteCategoryAction, saveCategoryAction } from "@/lib/actions";
import { getCategories, getWorkspaceScopeData } from "@/lib/data/queries";
import { withScope } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CategoriesPageProps = {
  searchParams?: {
    edit?: string;
    error?: string;
    scope?: string;
    success?: string;
  };
};

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const workspaceScope = await getWorkspaceScopeData(searchParams?.scope);
  const categories = await getCategories(workspaceScope.workspaceIds);
  const editing = categories.find((item) => item.id === searchParams?.edit);
  const errorMessage = searchParams?.error;
  const successMessage = searchParams?.success;
  const formWorkspaces = workspaceScope.scope === "all"
    ? workspaceScope.workspaces
    : workspaceScope.workspaces.filter((workspace) => workspace.kind === workspaceScope.scope);
  const selectedWorkspace = editing
    ? formWorkspaces.find((workspace) => workspace.id === editing.workspace_id)
    : formWorkspaces[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard title={editing ? "Editar categoria" : "Nueva categoria"} description="Categorias separadas por workspace y tipo de movimiento.">
        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
        ) : null}
        {successMessage ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
        ) : null}

        <form action={saveCategoryAction} className="space-y-4">
          <input type="hidden" name="id" defaultValue={editing?.id} />
          <input type="hidden" name="scope" value={workspaceScope.scope} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nombre</label>
            <input name="name" defaultValue={editing?.name} placeholder="Ej: Ventas" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Workspace</label>
              {workspaceScope.scope !== "all" && selectedWorkspace ? (
                <>
                  <input type="hidden" name="workspace_id" value={selectedWorkspace.id} />
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                    {selectedWorkspace.name} ({selectedWorkspace.kind === "personal" ? "Personal" : "Negocio"})
                  </div>
                </>
              ) : formWorkspaces.length === 0 ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  No hay workspaces disponibles para esta vista.
                </div>
              ) : (
                <select name="workspace_id" defaultValue={editing?.workspace_id ?? ""} required>
                  <option value="">Selecciona un workspace</option>
                  {formWorkspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name} ({workspace.kind === "personal" ? "Personal" : "Negocio"})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Tipo</label>
              <select name="kind" defaultValue={editing?.kind ?? "expense"}>
                <option value="expense">Gasto</option>
                <option value="income">Ingreso</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <SubmitButton label={editing ? "Actualizar categoria" : "Guardar categoria"} />
            {editing ? <a href={withScope("/categories", workspaceScope.scope)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Cancelar</a> : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Categorias registradas" description="Se usan para clasificar ingresos y gastos.">
        {categories.length === 0 ? (
          <EmptyState message="Todavia no hay categorias registradas para el workspace activo." />
        ) : (
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{category.name}</p>
                    <p className="text-sm text-slate-500">
                      {category.workspace?.kind === "personal" ? "Personal" : "Negocio"} - {category.kind === "income" ? "Ingreso" : "Gasto"}
                    </p>
                    <p className="text-sm text-slate-500">{category.workspace?.name ?? "Workspace"}</p>
                  </div>
                  <div className="flex gap-2">
                    <a href={withScope("/categories", workspaceScope.scope, { edit: category.id })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Editar</a>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={category.id} />
                      <input type="hidden" name="scope" value={workspaceScope.scope} />
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
