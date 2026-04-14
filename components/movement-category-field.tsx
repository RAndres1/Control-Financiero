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
    if (!filteredAccounts.some((account) => account.id === accountId)) {
      setAccountId("");
    }
  }, [filteredAccounts, accountId]);

  useEffect(() => {
    if (!filteredCategories.some((category) => category.id === categoryId)) {
      setCategoryId("");
    }
  }, [filteredCategories, categoryId]);

  return (
    <>
      {workspaces.length > 1 ? (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Workspace</label>
          <select name="workspace_id" value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} required>
            <option value="">Selecciona un workspace</option>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name} ({workspace.kind === "personal" ? "Personal" : "Negocio"})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="workspace_id" value={workspaceId} />
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Tipo</label>
        <select name="kind" value={kind} onChange={(event) => setKind(event.target.value as MovementKind)}>
          <option value="expense">Gasto</option>
          <option value="income">Ingreso</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Cuenta</label>
        <select name="account_id" value={accountId} onChange={(event) => setAccountId(event.target.value)} required>
          <option value="">Selecciona una cuenta</option>
          {filteredAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Categoria</label>
        <select name="category_id" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>
          <option value="">Selecciona una categoria</option>
          {filteredCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
