"use client";

import { useEffect, useMemo, useState } from "react";

import type { Account, Category, MovementKind, Workspace } from "@/lib/types";

type MovementCategoryFieldProps = {
  accounts: Account[];
  categories: Category[];
  workspaces: Workspace[];
  defaultWorkspaceId?: string;
  defaultKind: MovementKind;
  defaultAccountId?: string;
  defaultCategoryId?: string;
};

export function MovementCategoryField({
  accounts,
  categories,
  workspaces,
  defaultWorkspaceId,
  defaultKind,
  defaultAccountId,
  defaultCategoryId
}: MovementCategoryFieldProps) {
  const initialWorkspaceId = defaultWorkspaceId ?? workspaces[0]?.id ?? "";
  const [workspaceId, setWorkspaceId] = useState(initialWorkspaceId);
  const [kind, setKind] = useState<MovementKind>(defaultKind);
  const [accountId, setAccountId] = useState(defaultAccountId ?? "");
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? "");

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => account.workspace_id === workspaceId);
  }, [accounts, workspaceId]);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => category.workspace_id === workspaceId && category.kind === kind);
  }, [categories, workspaceId, kind]);

  useEffect(() => {
    if (workspaces.length === 0) {
      setWorkspaceId("");
      return;
    }

    if (!workspaces.some((workspace) => workspace.id === workspaceId)) {
      setWorkspaceId(workspaces[0].id);
    }
  }, [workspaceId, workspaces]);

  useEffect(() => {
    if (filteredAccounts.length === 0) {
      setAccountId("");
      return;
    }

    if (!filteredAccounts.some((account) => account.id === accountId)) {
      setAccountId(filteredAccounts[0].id);
    }
  }, [filteredAccounts, accountId]);

  useEffect(() => {
    if (filteredCategories.length === 0) {
      setCategoryId("");
      return;
    }

    if (!filteredCategories.some((category) => category.id === categoryId)) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [filteredCategories, categoryId]);

  const selectedWorkspace = workspaces.find((workspace) => workspace.id === workspaceId);

  return (
    <div className="space-y-5">
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="kind" value={kind} />

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Tipo</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setKind("expense")}
            className={[
              "rounded-2xl px-4 py-3 text-sm font-medium transition",
              kind === "expense"
                ? "bg-rose-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            ].join(" ")}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() => setKind("income")}
            className={[
              "rounded-2xl px-4 py-3 text-sm font-medium transition",
              kind === "income"
                ? "bg-emerald-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            ].join(" ")}
          >
            Ingreso
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Categoria</label>
          <select
            name="category_id"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            required
            className="h-12 rounded-2xl"
          >
            <option value="">{filteredCategories.length === 0 ? "Primero crea una categoria" : "Selecciona una categoria"}</option>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Cuenta</label>
          <select
            name="account_id"
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            required
            className="h-12 rounded-2xl"
          >
            <option value="">{filteredAccounts.length === 0 ? "Primero crea una cuenta" : "Selecciona una cuenta"}</option>
            {filteredAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {workspaces.length > 1 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <label className="mb-2 block text-sm font-medium text-slate-700">Se registrara en</label>
          <select
            value={workspaceId}
            onChange={(event) => setWorkspaceId(event.target.value)}
            required
            className="h-11 rounded-2xl border border-slate-200 bg-white"
          >
            <option value="">Selecciona un workspace</option>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name} ({workspace.kind === "personal" ? "Personal" : "Negocio"})
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
        {selectedWorkspace
          ? `Movimiento ${kind === "expense" ? "de gasto" : "de ingreso"} en ${selectedWorkspace.name}.`
          : "Selecciona el contexto del movimiento."}
      </div>
    </div>
  );
}
