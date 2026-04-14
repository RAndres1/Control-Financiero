import { DeleteButton, EmptyState, SectionCard, SubmitButton } from "@/components/ui";
import { deleteCategoryAction, saveCategoryAction } from "@/lib/actions";
import { getCategories } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

type CategoriesPageProps = {
  searchParams?: {
    edit?: string;
    error?: string;
    success?: string;
  };
};

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const categories = await getCategories();
  const editing = categories.find((item) => item.id === searchParams?.edit);
  const errorMessage = searchParams?.error;
  const successMessage = searchParams?.success;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard title={editing ? "Editar categoria" : "Nueva categoria"} description="Categorias separadas por ambito y tipo de movimiento.">
        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
        ) : null}
        {successMessage ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
        ) : null}

        <form action={saveCategoryAction} className="space-y-4">
          <input type="hidden" name="id" defaultValue={editing?.id} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nombre</label>
            <input name="name" defaultValue={editing?.name} placeholder="Ej: Ventas" required />
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
              <select name="kind" defaultValue={editing?.kind ?? "expense"}>
                <option value="expense">Gasto</option>
                <option value="income">Ingreso</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <SubmitButton label={editing ? "Actualizar categoria" : "Guardar categoria"} />
            {editing ? <a href="/categories" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Cancelar</a> : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Categorias registradas" description="Se usan para clasificar ingresos y gastos.">
        {categories.length === 0 ? (
          <EmptyState message="Todavia no hay categorias registradas." />
        ) : (
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{category.name}</p>
                    <p className="text-sm text-slate-500">
                      {category.owner_type === "personal" ? "Personal" : "Negocio"} - {category.kind === "income" ? "Ingreso" : "Gasto"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a href={`/categories?edit=${category.id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Editar</a>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={category.id} />
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
