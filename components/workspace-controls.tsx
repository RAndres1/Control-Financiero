"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import type { WorkspaceScope } from "@/lib/types";

const navigation = [
  { href: "/", label: "Dashboard" },
  { href: "/reports", label: "Reportes" },
  { href: "/accounts", label: "Cuentas" },
  { href: "/categories", label: "Categorias" },
  { href: "/movements", label: "Movimientos" }
];

const scopeLabels: Record<WorkspaceScope, string> = {
  personal: "Personal",
  business: "Negocio",
  all: "Ambos"
};

export function WorkspaceControls({ availableScopes }: { availableScopes: WorkspaceScope[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeScope = searchParams.get("scope");
  const currentScope = availableScopes.includes(activeScope as WorkspaceScope)
    ? (activeScope as WorkspaceScope)
    : (availableScopes[0] ?? "personal");

  return (
    <div className="flex flex-col gap-4 lg:items-end">
      <div className="flex flex-wrap gap-2">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={currentScope ? `${item.href}?scope=${currentScope}` : item.href}
            className={`rounded-full border px-4 py-2 text-sm text-white ${
              pathname === item.href ? "border-white/40 bg-white/20" : "border-white/15 bg-white/10 hover:bg-white/20"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {availableScopes.length > 1 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3 py-2">
          <span className="text-sm text-slate-200">Vista</span>
          <div className="flex flex-wrap gap-2">
            {availableScopes.map((scope) => (
              <Link
                key={scope}
                href={`${pathname}?scope=${scope}`}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  currentScope === scope
                    ? "bg-white text-slate-900"
                    : "border border-white/15 bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {scopeLabels[scope]}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
