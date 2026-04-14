import Link from "next/link";
import { ReactNode } from "react";

const navigation = [
  { href: "/", label: "Dashboard" },
  { href: "/reports", label: "Reportes" },
  { href: "/accounts", label: "Cuentas" },
  { href: "/categories", label: "Categorias" },
  { href: "/movements", label: "Movimientos" }
];

export function LayoutShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-8 overflow-hidden rounded-[28px] bg-ink px-6 py-8 text-white shadow-soft">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm uppercase tracking-[0.24em] text-emerald-200">Control Financiero</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Finanzas personales y negocio en una sola vista.</h1>
            <p className="mt-3 max-w-xl text-sm text-slate-300 sm:text-base">
              MVP enfocado en registrar cuentas, categorias y movimientos con separacion clara entre personal y emprendimiento.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
