import { ReactNode } from "react";

export function SectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-[24px] bg-white p-5 shadow-soft ring-1 ring-slate-200/70 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function MetricCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "positive" | "warning" }) {
  const toneClass = tone === "positive" ? "border-emerald-200 bg-emerald-50" : tone === "warning" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50";

  return (
    <article className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{message}</div>;
}

export function SubmitButton({ label }: { label: string }) {
  return <button type="submit" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">{label}</button>;
}

export function DeleteButton({ label = "Eliminar" }: { label?: string }) {
  return <button type="submit" className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50">{label}</button>;
}
