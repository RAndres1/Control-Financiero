import { ReactNode } from "react";

import { createBusinessWorkspaceAction } from "@/lib/actions";
import { logoutAction } from "@/lib/auth-actions";
import { WorkspaceControls } from "@/components/workspace-controls";
import type { WorkspaceScope } from "@/lib/types";

export function LayoutShell({
  children,
  availableScopes,
  userEmail
}: {
  children: ReactNode;
  availableScopes: WorkspaceScope[];
  userEmail?: string;
}) {
  const hasBusinessWorkspace = availableScopes.includes("business");

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-8 overflow-hidden rounded-[28px] bg-ink px-6 py-8 text-white shadow-soft">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm uppercase tracking-[0.24em] text-emerald-200">Control Financiero</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Finanzas personales y negocio en una sola vista.</h1>
            <p className="mt-3 max-w-xl text-sm text-slate-300 sm:text-base">
              MVP enfocado en registrar cuentas, categorias y movimientos con separacion clara por workspace activo.
            </p>
            {userEmail ? <p className="mt-4 text-sm text-slate-400">{userEmail}</p> : null}
          </div>
          <div className="flex flex-col gap-4 lg:items-end">
            <WorkspaceControls availableScopes={availableScopes} />
            {!hasBusinessWorkspace ? (
              <form action={createBusinessWorkspaceAction} className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-white/5 p-3">
                <input
                  name="business_workspace_name"
                  defaultValue="Negocio"
                  className="min-w-[220px] rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-400"
                  placeholder="Nombre del negocio"
                />
                <button type="submit" className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-400/25">
                  Crear espacio de negocio
                </button>
              </form>
            ) : null}
            <form action={logoutAction}>
              <button type="submit" className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">
                Cerrar sesion
              </button>
            </form>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
